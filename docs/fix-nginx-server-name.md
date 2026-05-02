# Nginx server_name 설정 수정

## 문제

EC2 인스턴스에 Elastic IP가 할당되지 않아 재시작 시마다 퍼블릭 IP가 변경됨.
nginx `server_name`이 이전 IP(`3.95.2.132`)로 하드코딩되어 있어서, 새 IP로 접속하면 nginx 기본 404 페이지가 반환되는 문제 발생.

## 원인

- `/etc/nginx/conf.d/buzzy-pages.conf`의 `server_name`이 특정 IP로 고정
- `/etc/nginx/nginx.conf`의 기본 서버 블록(`server_name _`)이 요청을 먼저 가로채서 프로젝트 서버로 프록시되지 않음

## 변경 내용

### 1. `/etc/nginx/conf.d/buzzy-pages.conf`

```diff
 server {
     listen 80;
-    server_name 3.95.2.132;
+    server_name _;
     ...
 }
```

### 2. `/etc/nginx/nginx.conf`

기본 서버 블록(37~53번째 줄) 주석 처리:

```diff
-    server {
-        listen       80;
-        listen       [::]:80;
-        server_name  _;
-        root         /usr/share/nginx/html;
-        include /etc/nginx/default.d/*.conf;
-        error_page 404 /404.html;
-        location = /404.html {
-        }
-        error_page 500 502 503 504 /50x.html;
-        location = /50x.html {
-        }
-    }
+    # 기본 서버 블록 비활성화 (buzzy-pages.conf에서 처리)
```

## 적용 명령

```bash
sudo nginx -t
sudo systemctl reload nginx
```
