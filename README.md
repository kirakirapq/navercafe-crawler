##  usage 
* This system is Naver-Cafe Crawling system.
* You can get comments from the navercafe page.
* As a use case, this system can be deployed on Cloud Run and used as an API.

## API

* **Crawling destination**: **http://cafe.naver.com/{cafeid}/{pageid}**

* **EndPoint**: **CloudRun URL + /cafeid/:cafeid/pageid/:pageid**

* Parameters

|Parameter|Value|Example|
|:--:|:--:|:--:|
|:cafeid|naver cafe id||
|:pageid|page id||

* Response

|Key|Value|
|:--:|:--:|
|isSuccess|Bool|
|hasComment|Bool|
|statusCode|Int|
|response|Array|
|response.[].id|String|
|response.[].url|String|
|response.[].cafeid|Array|
|response.[].pageid|Array|
|response.[].name|String|
|response.[].comment|String|
|response.[].date|DateTime|

##  Deployment instructions for your GCP project

### 1. build & push docker image

```
docker build --no-cache -t gcr.io/{your-project-id}/navercafe-crawler -f Dockerfile .

docker push  gcr.io/{your-project-id}/navercafe-crawler:latest
```

* Run on local

```
docker run -p 80:8080 \
-d gcr.io/{your-project-id}/navercafe-crawler:latest
```

* Run locally and enter the container and mount file

```
docker run -it -p 80:8080 \
-v $PWD/app:/src/app \ß
-d gcr.io/{your-project-id}/navercafe-crawler:latest \
/bin/bash
```

### 2. Deploy Cloud Run

|Setting|Value|
|:--:|:--:|
|IMAGE URL|gcr.io/{your-project-id}/navercafe-crawler|
|PORT|80|
|capacity||
|CPU|4|
|MEMORY|8GiB|
|concurrency|1|
|REQUEST TIMEOUT|600sec|
|instances||
|MIN|0|
|MAX|100|
|security||
|service account|Cloud Run executer Account|
