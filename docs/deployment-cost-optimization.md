# 소규모 서비스 배포 비용 최적화 제안

작성일: 2026-05-13

이 문서는 현재 `buzzy pages` 프로젝트가 AWS EC2 한 대에서 실행되는 구조를 기준으로, 소규모/캡스톤 프로젝트에 적합한 배포 구조와 조금 더 안정적인 배포 구조를 비교한다.

현재 코드 기준 주요 구성은 다음과 같다.

- Frontend: React 18, Vite, TypeScript
- Backend: Node.js, Express, TypeScript
- Database: MySQL, Prisma
- File upload: EC2 로컬 `server/uploads`
- Process manager: PM2
- Reverse proxy: Nginx
- Production serving: Express가 `client/dist` 정적 파일과 `/api`를 함께 제공

## 결론 요약

예산을 가장 아껴야 하고 사용자가 많지 않다면 **Option A: 단일 서버 구조**가 가장 현실적이다. 운영 부담이 적고, AWS 서비스가 많이 늘어나지 않아 비용 예측이 쉽다.

사용자 데이터와 업로드 파일을 더 안전하게 보관하고, 서버 교체나 장애 대응을 쉽게 만들고 싶다면 **Option B: 프론트/업로드 분리 구조**가 좋다. 비용은 조금 늘 수 있지만, 서비스 운영 안정성은 확실히 좋아진다.

## Option A. 소규모/캡스톤 기준 최저비용 구조

### 구조

```text
사용자
  |
  v
Nginx
  |
  v
EC2 또는 Lightsail 1대
  |
  +-- Express API
  +-- React 정적 파일(client/dist)
  +-- MySQL
  +-- uploads 로컬 디렉터리
  +-- PM2
```

### 적합한 상황

- 캡스톤 발표, 시연, 소규모 사용자 테스트가 목적이다.
- 월 비용을 가장 낮게 유지해야 한다.
- 트래픽이 많지 않고, 동시 접속자가 적다.
- 장애 발생 시 수동 복구를 어느 정도 감수할 수 있다.
- 운영자가 서버에 직접 접속해서 배포, 로그 확인, DB 백업을 할 수 있다.

### 장점

- 구조가 단순하다.
- 비용이 가장 낮다.
- 배포 대상이 한 대라서 이해하기 쉽다.
- Nginx, PM2, MySQL, Node.js만 관리하면 된다.
- 프론트와 백엔드가 같은 origin에서 동작하므로 CORS 설정이 단순하다.

### 단점

- 서버 한 대에 모든 것이 몰려 있어 장애 지점이 하나다.
- EC2 디스크가 손상되거나 인스턴스를 새로 만들면 업로드 파일과 DB가 위험할 수 있다.
- 트래픽 증가 시 프론트 정적 파일 요청도 API 서버 자원을 함께 사용한다.
- DB 백업, 보안 패치, 로그 관리, 디스크 용량 관리를 직접 해야 한다.
- MySQL과 Node.js가 같은 작은 서버에서 돌기 때문에 메모리 부족이 생길 수 있다.

### 비용 관점

가장 큰 비용은 보통 서버 인스턴스다. 소규모라면 EC2 `t3.micro`, `t4g.micro` 또는 Lightsail 저가형 번들을 검토할 수 있다.

Lightsail은 월 고정형 요금에 가까워 예산을 설명하기 쉽다. EC2는 더 유연하지만 EBS, 퍼블릭 IPv4, 데이터 전송량 등 주변 비용을 함께 봐야 한다.

### 운영 권장사항

#### 1. 인스턴스 크기 낮추기

현재 사용량이 작다면 작은 인스턴스부터 시작한다.

권장 시작점:

- 최소 시연용: Lightsail 0.5GB 또는 EC2 micro급
- MySQL까지 같은 서버에서 실행: 가능하면 1GB RAM 이상
- AI 요청, 빌드 작업, 동시 접속이 조금 있다면 2GB RAM 이상 고려

Node.js, MySQL, Nginx, PM2를 함께 돌리기 때문에 0.5GB RAM은 빡빡할 수 있다. 실제 운영에서는 `free -h`, `htop`, CloudWatch 지표로 메모리 사용량을 확인해야 한다.

#### 2. 서버에서 빌드하지 않기

작은 서버에서 `npm install`, `npm run build`를 직접 수행하면 메모리가 부족할 수 있다.

더 좋은 방식:

```text
로컬 또는 CI에서 빌드
  -> client/dist, server/dist 생성
  -> EC2에는 빌드 결과물만 업로드
  -> PM2 restart
```

#### 3. MySQL 백업 자동화

단일 서버 구조에서 가장 중요한 것은 DB 백업이다.

예시 운영 방식:

```text
매일 새벽 mysqldump 실행
  -> 압축
  -> S3 또는 별도 저장소에 업로드
  -> 오래된 백업 삭제
```

백업 파일을 같은 EC2 안에만 두면 서버 장애 시 함께 사라질 수 있으므로, 가능하면 S3나 외부 저장소에 복사한다.

#### 4. 업로드 파일 백업

현재 코드는 `/uploads` 정적 디렉터리를 사용한다.

최저비용 구조를 유지하더라도 다음 중 하나는 필요하다.

- `server/uploads`를 주기적으로 압축해서 S3에 백업
- EC2 스냅샷을 주기적으로 생성
- 업로드 파일 용량 제한 적용

#### 5. 로그와 디스크 관리

PM2 로그, Nginx 로그, MySQL 로그가 계속 쌓이면 작은 디스크를 빠르게 채울 수 있다.

권장:

- PM2 log rotate 설정
- Nginx logrotate 확인
- MySQL binlog 사용 여부 확인
- `df -h`로 디스크 사용량 주기 확인

### 이 구조에서 개선할 수 있는 코드/설정

현재 `nginx/book-discussion.conf`는 모든 요청을 Express로 프록시한다.

단일 서버 구조를 유지하더라도 Nginx가 정적 파일을 직접 서빙하게 만들면 Express 부하를 줄일 수 있다.

예시:

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

이렇게 하면 React 정적 파일은 Nginx가 처리하고, Express는 API만 처리한다.

## Option B. 조금 더 안정적인 구조

### 구조

```text
사용자
  |
  +--------------------+
  |                    |
  v                    v
S3 + CloudFront      EC2 또는 Lightsail
React 정적 파일       Express API
                       |
                       +-- MySQL 또는 RDS
                       |
                       +-- S3 업로드 저장소
```

대안으로 프론트엔드는 S3 + CloudFront 대신 Vercel, Netlify, GitHub Pages를 사용할 수 있다.

### 적합한 상황

- 실제 사용자를 어느 정도 받을 계획이 있다.
- 서버를 새로 만들어도 업로드 파일이 사라지면 안 된다.
- 프론트 배포와 백엔드 배포를 분리하고 싶다.
- 정적 파일 전송 부하를 API 서버에서 빼고 싶다.
- 운영 안정성을 조금 더 중요하게 본다.

### 장점

- 프론트 정적 파일 요청이 API 서버를 사용하지 않는다.
- CloudFront나 정적 호스팅을 사용하면 전 세계 사용자에게 더 빠르게 전달할 수 있다.
- 업로드 파일을 S3에 저장하면 EC2 교체, 재배포, 장애에 강해진다.
- 서버는 API 처리에 집중할 수 있다.
- 나중에 EC2를 교체하거나 확장하기 쉽다.

### 단점

- 관리할 서비스가 늘어난다.
- S3 bucket, CloudFront, CORS, 환경변수 설정이 추가된다.
- 배포 파이프라인이 단일 서버보다 복잡하다.
- RDS까지 도입하면 월 비용이 확실히 증가할 수 있다.

## Option B 세부 설계

### 1. Frontend를 정적 호스팅으로 분리

현재 프론트 API 클라이언트는 `baseURL: '/api'`를 사용한다. 프론트와 백엔드가 같은 도메인에서 제공될 때는 이 방식이 편하다.

프론트를 별도 도메인으로 분리하면 다음 중 하나를 선택해야 한다.

#### 방식 A: API 절대 URL 사용

```ts
baseURL: import.meta.env.VITE_API_BASE_URL
```

예시 환경변수:

```env
VITE_API_BASE_URL=https://api.example.com/api
```

장점:

- 구조가 명확하다.
- 프론트 호스팅 위치와 API 서버 위치가 완전히 분리된다.

주의점:

- 백엔드 CORS 설정을 정확히 해야 한다.
- 쿠키 기반 인증을 사용한다면 SameSite, Secure 설정까지 봐야 한다.

현재 프로젝트는 JWT를 주로 사용하므로, Authorization header 방식이면 분리가 비교적 쉽다.

#### 방식 B: CloudFront에서 `/api`만 API 서버로 라우팅

```text
https://example.com
  /assets/* -> S3
  /api/*    -> EC2 Express
  /*        -> S3 index.html
```

장점:

- 프론트 코드는 기존처럼 `/api`를 유지할 수 있다.
- 사용자 입장에서는 하나의 도메인만 사용한다.
- CORS 문제가 줄어든다.

단점:

- CloudFront behavior 설정이 필요하다.
- 처음 설정 난이도가 방식 A보다 높다.

### 2. 업로드 파일을 S3로 이동

현재 업로드 흐름은 대략 다음과 같다.

```text
multer
  -> EC2 server/uploads 저장
  -> DB에 /uploads/filename 저장
  -> Express static으로 제공
```

S3로 바꾸면 다음 구조가 된다.

```text
multer memoryStorage
  -> S3 PutObject
  -> DB에 S3 또는 CloudFront URL 저장
```

권장 저장 방식:

- S3 bucket은 private으로 유지
- 공개 프로필 이미지만 CloudFront 또는 presigned URL로 제공
- 파일명은 UUID 기반으로 생성
- 파일 크기와 MIME type 제한
- 오래된 프로필 이미지는 삭제하거나 lifecycle rule 적용

업로드 파일을 S3로 옮기면 EC2는 언제든 새로 만들어도 된다. 이 변화 하나만으로도 운영 안정성이 크게 좋아진다.

### 3. DB 선택: EC2 MySQL 유지 vs RDS

#### EC2 내부 MySQL 유지

장점:

- 가장 저렴하다.
- 구조가 단순하다.
- 네트워크 지연이 거의 없다.

단점:

- 백업, 복구, 패치, 장애 대응을 직접 해야 한다.
- 서버 장애 시 API와 DB가 동시에 멈춘다.
- 디스크 용량 관리가 중요하다.

소규모 캡스톤에는 이 방식도 충분히 가능하다. 단, 자동 백업은 반드시 있어야 한다.

#### RDS MySQL 사용

장점:

- 백업과 복구가 편하다.
- DB를 앱 서버와 분리할 수 있다.
- EC2를 교체해도 DB는 유지된다.
- 모니터링과 유지보수가 편해진다.

단점:

- 비용이 증가한다.
- 보안 그룹, 서브넷, 파라미터 그룹 등 설정이 늘어난다.
- 작은 프로젝트에서는 과할 수 있다.

AWS Free Tier를 사용할 수 있는 계정이라면 RDS micro급을 실험적으로 사용하는 것도 좋다. Free Tier가 끝났거나 예산이 작다면 EC2 내부 MySQL + 자동 백업이 더 현실적이다.

## 단계별 전환 전략

한 번에 모든 구조를 바꾸기보다 위험이 낮은 순서로 나누는 것이 좋다.

### 1단계: 현재 단일 서버 구조 안정화

- Nginx 정적 파일 서빙 적용
- PM2 log rotate 설정
- MySQL 백업 자동화
- uploads 백업 자동화
- CloudWatch 또는 간단한 서버 모니터링 적용

### 2단계: 업로드 파일 S3 이전

- S3 bucket 생성
- IAM 권한 최소화
- `multer.diskStorage`에서 `memoryStorage` 또는 임시 파일 방식으로 변경
- 업로드 후 S3 URL을 DB에 저장
- 기존 `/uploads` 파일 마이그레이션

이 단계는 비용 대비 안정성 개선 효과가 크다.

### 3단계: 프론트 정적 호스팅 분리

- `VITE_API_BASE_URL` 도입 또는 CloudFront `/api` 라우팅 선택
- 프론트 배포 대상을 S3/CloudFront, Vercel, Netlify 중 선택
- 백엔드 CORS origin 제한
- 배포 문서 업데이트

### 4단계: DB 분리 검토

- 사용자 수, 데이터 중요도, 백업 복구 요구사항 확인
- RDS Free Tier 가능 여부 확인
- 비용이 허용되면 RDS Single-AZ부터 고려
- 고가용성이 꼭 필요할 때만 Multi-AZ 검토

## 추천 우선순위

이 프로젝트에는 다음 순서를 추천한다.

1. 현재 EC2 또는 Lightsail 한 대 구조 유지
2. DB와 uploads 자동 백업 추가
3. Nginx가 React 정적 파일 직접 서빙
4. 업로드 이미지를 S3로 이전
5. 프론트 정적 호스팅 분리
6. 필요할 때 RDS 도입

가장 먼저 해야 할 일은 서버를 더 복잡하게 만드는 것이 아니라, 현재 단일 서버 구조에서 데이터가 사라지지 않게 만드는 것이다.

## 선택 기준표

| 기준 | Option A: 단일 서버 | Option B: 분리형 |
| --- | --- | --- |
| 월 비용 | 가장 낮음 | 조금 증가 |
| 구조 복잡도 | 낮음 | 중간 |
| 장애 대응 | 수동 대응 필요 | 더 쉬움 |
| 업로드 파일 안정성 | 낮음, 백업 필요 | 높음 |
| 프론트 성능 | 서버 성능에 의존 | 정적 호스팅/CDN 활용 가능 |
| 배포 난이도 | 낮음 | 중간 |
| 캡스톤 시연 | 적합 | 적합하지만 약간 과할 수 있음 |
| 실제 사용자 운영 | 제한적으로 가능 | 더 적합 |

## 피하는 것이 좋은 구조

현재 규모에서는 다음 구조는 비용 대비 효율이 낮을 가능성이 크다.

```text
ALB
  -> ECS/Fargate
  -> RDS Multi-AZ
  -> NAT Gateway
  -> Private Subnet 다중 구성
```

이 구조는 실무적으로는 좋은 구조일 수 있지만, 캡스톤/소규모 서비스에서는 고정비와 운영 복잡도가 크게 증가한다. 특히 NAT Gateway와 Load Balancer는 작은 프로젝트에서 체감 비용이 커질 수 있다.

## 참고 링크

- AWS EC2 On-Demand: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-on-demand-instances.html
- AWS Lightsail Pricing: https://aws.amazon.com/lightsail/pricing/
- Amazon S3 Pricing: https://aws.amazon.com/pricing/s3/
- Amazon RDS Free Tier: https://aws.amazon.com/rds/free/
- AWS Compute Optimizer: https://docs.aws.amazon.com/compute-optimizer/latest/ug/rightsizing-preferences.html
