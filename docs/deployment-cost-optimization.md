# 소규모 서비스 배포 구조 제안

작성일: 2026-05-13  
수정일: 2026-05-14

이 문서는 `buzzy pages` 프로젝트의 배포 구조를 **EC2 + S3** 기준으로 정리한다. 기존에는 EC2 단일 서버 구조와 S3 + CloudFront 분리 구조를 함께 검토했지만, 현재 서비스 규모와 비용을 고려해 CloudFront는 기본 구조에서 제외한다.

## 결론

현재 프로젝트에는 **EC2 한 대에서 웹/API/DB를 운영하고, 사용자 업로드 이미지만 S3에 저장하는 구조**가 가장 현실적이다.

```text
사용자
  |
  v
Nginx
  |
  v
EC2 또는 Lightsail 1대
  |
  +-- React 정적 파일(client/dist)
  +-- Express API
  +-- MySQL
  +-- PM2
  |
  v
S3
  +-- profile-images/
  +-- thread-images/    예정
  +-- comment-images/   예정
  +-- db-backups/       선택
```

이 구조는 CloudFront를 사용하지 않는다. 프론트엔드 정적 파일은 EC2의 Nginx가 제공하고, 이미지 업로드 파일은 S3에 직접 저장한다.

## 왜 EC2+S3인가

### 장점

- CloudFront, ALB, ECS 같은 추가 서비스 없이 구조가 단순하다.
- EC2를 교체하거나 재배포해도 업로드 이미지가 사라지지 않는다.
- 프로필 이미지뿐 아니라 스레드/댓글 이미지 기능을 추가하기 쉽다.
- S3 저장 비용은 이미지 용량이 작을 때 매우 낮은 편이다.
- 프론트와 API가 같은 서버에서 제공되므로 CORS 설정이 단순하다.

### 단점

- 프론트 정적 파일 전송은 여전히 EC2/Nginx가 담당한다.
- S3 public object URL을 직접 사용하므로 CDN 캐싱 이점은 없다.
- S3 버킷 정책, IAM 권한, 파일 삭제 정책을 직접 관리해야 한다.
- DB는 EC2에 남아 있으므로 MySQL 백업은 별도로 필요하다.

## CloudFront를 제외하는 이유

현재 CloudFront는 비용 대비 이점이 크지 않다.

- 현재 이미지 사용량이 작고, 전 세계 CDN 성능이 꼭 필요한 단계가 아니다.
- CloudFront를 붙이면 배포 구조, 캐시 무효화, behavior 설정이 늘어난다.
- 프론트엔드를 S3 정적 호스팅으로 분리하지 않는다면 CloudFront의 효과가 제한적이다.
- 지금의 우선순위는 CDN 최적화보다 업로드 파일을 EC2 디스크에서 분리하는 것이다.

따라서 CloudFront는 향후 트래픽 증가, 글로벌 사용자, 정적 프론트 분리 필요성이 생겼을 때 다시 검토한다.

## 현재 코드 기준 파일 저장 방식

현재 서버는 환경변수로 파일 저장소를 선택한다.

로컬 개발:

```env
FILE_STORAGE_DRIVER=local
```

운영 EC2+S3:

```env
FILE_STORAGE_DRIVER=s3
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=your-bucket-name
```

S3 사용 시 서버는 업로드된 이미지의 URL을 다음 형식으로 DB에 저장한다.

```text
https://your-bucket-name.s3.ap-northeast-2.amazonaws.com/profile-images/filename.webp
```

현재 구현된 업로드 대상은 프로필 이미지다. 이후 스레드와 댓글 이미지 기능을 추가할 때 같은 저장 계층을 확장한다.

## S3 버킷 운영 기준

### 권장 버킷 설정

- Region: `ap-northeast-2`
- Object ownership: ACL 비활성화 권장
- Public access block: 공개 이미지 제공 방식에 맞춰 조정
- Bucket policy: 공개 이미지 prefix만 읽기 허용
- CORS: 브라우저에서 S3로 직접 업로드하지 않는다면 최소 설정
- Lifecycle rule: 오래된 미사용 이미지 정리 검토

현재 서버가 S3에 업로드하고 사용자는 저장된 URL로 이미지를 조회하는 방식이므로, 최소한 이미지 객체에 대한 `GetObject` 접근이 가능해야 한다.

예시 bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPublicReadForUploadedImages",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::your-bucket-name/profile-images/*",
        "arn:aws:s3:::your-bucket-name/thread-images/*",
        "arn:aws:s3:::your-bucket-name/comment-images/*"
      ]
    }
  ]
}
```

DB 백업 파일까지 같은 버킷에 둔다면 `db-backups/*`는 공개하지 않는다.

## IAM 권한

EC2에서 사용하는 IAM user 또는 role에는 업로드 이미지 prefix에 대한 최소 권한만 부여한다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/profile-images/*",
        "arn:aws:s3:::your-bucket-name/thread-images/*",
        "arn:aws:s3:::your-bucket-name/comment-images/*"
      ]
    }
  ]
}
```

이미지 조회는 public object URL로 처리하므로 서버가 `GetObject` 권한을 반드시 가질 필요는 없다. 다만 서버에서 이미지 존재 확인이나 삭제 검증을 하려면 `s3:GetObject` 또는 `s3:HeadObject` 권한을 추가한다.

## EC2 역할

EC2는 다음만 담당한다.

- Nginx로 React 정적 파일 제공
- Express API 실행
- MySQL 실행
- S3로 이미지 업로드
- PM2로 프로세스 관리

Nginx가 정적 파일을 직접 서빙하게 만들면 Express 부하를 줄일 수 있다.

```nginx
location /assets/ {
    root /var/www/book-discussion/client/dist;
    expires 30d;
    add_header Cache-Control "public, immutable";
}

location /api/ {
    proxy_pass http://127.0.0.1:3000;
}

location / {
    root /var/www/book-discussion/client/dist;
    try_files $uri /index.html;
}
```

## 기능 확장 순서

배포 구조는 먼저 EC2+S3로 확정하고, 그 다음 이미지 기능을 넓힌다.

1. 프로필 이미지가 S3에 저장되는지 확인
2. 파일 저장 서비스를 공통 함수로 확장
3. 스레드 이미지 업로드 추가
4. 댓글 이미지 업로드 추가
5. 이미지 삭제 또는 교체 시 S3 객체 정리

권장 S3 key 구조:

```text
profile-images/{uuid}.{ext}
thread-images/{threadId}/{uuid}.{ext}
comment-images/{commentId}/{uuid}.{ext}
```

## 운영 필수 항목

### MySQL 백업

S3를 이미지 저장소로 사용하더라도 DB는 EC2 안에 있으므로 자동 백업이 필요하다.

```text
매일 새벽 mysqldump 실행
  -> 압축
  -> S3 db-backups/ 업로드
  -> 오래된 백업 삭제
```

### 로그와 디스크 관리

- PM2 log rotate 설정
- Nginx logrotate 확인
- MySQL binlog 사용 여부 확인
- `df -h`로 디스크 사용량 확인

### 업로드 제한

- 이미지 MIME type 제한
- 파일 크기 제한
- UUID 기반 파일명 사용
- 필요 시 이미지 개수 제한

## 나중에 다시 검토할 수 있는 선택지

다음 조건이 생기면 CloudFront 또는 RDS를 다시 검토한다.

- 이미지 트래픽이 커져 S3 직접 전송 비용이나 지연이 부담된다.
- 프론트엔드를 EC2에서 분리해 S3 정적 호스팅으로 운영한다.
- 해외 사용자가 많아져 CDN 캐싱 효과가 필요하다.
- DB 백업과 복구 요구사항이 커져 RDS가 필요하다.

현재 단계에서는 다음 구조는 비용 대비 과하다.

```text
CloudFront
ALB
ECS/Fargate
RDS Multi-AZ
NAT Gateway
Private Subnet 다중 구성
```

## 참고 링크

- AWS EC2 On-Demand: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-on-demand-instances.html
- Amazon S3 Pricing: https://aws.amazon.com/pricing/s3/
- Amazon S3 Bucket Policy Examples: https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html
- AWS IAM Policies for S3: https://docs.aws.amazon.com/AmazonS3/latest/userguide/security_iam_service-with-iam.html
