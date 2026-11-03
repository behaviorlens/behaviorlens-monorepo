"""Object storage for recorded event chunks (S3-compatible; SeaweedFS locally)."""

import logging
import threading
from functools import lru_cache
from typing import Protocol

from app.config import get_settings

logger = logging.getLogger(__name__)


class ObjectStore(Protocol):
    def put(self, key: str, data: bytes) -> None: ...

    def get(self, key: str) -> bytes: ...

    def delete_prefix(self, prefix: str) -> int: ...


class MemoryObjectStore:
    """In-process store for tests and local experiments."""

    def __init__(self) -> None:
        self._objects: dict[str, bytes] = {}
        self._lock = threading.Lock()

    def put(self, key: str, data: bytes) -> None:
        with self._lock:
            self._objects[key] = data

    def get(self, key: str) -> bytes:
        with self._lock:
            return self._objects[key]

    def delete_prefix(self, prefix: str) -> int:
        with self._lock:
            keys = [key for key in self._objects if key.startswith(prefix)]
            for key in keys:
                del self._objects[key]
            return len(keys)

    def keys(self) -> list[str]:
        with self._lock:
            return sorted(self._objects)


class S3ObjectStore:
    def __init__(self) -> None:
        import boto3
        from botocore.config import Config

        settings = get_settings()
        self.bucket = settings.s3_bucket
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
            config=Config(s3={"addressing_style": "path"}, retries={"max_attempts": 3}),
        )
        self._bucket_ready = False
        self._lock = threading.Lock()

    def _ensure_bucket(self) -> None:
        if self._bucket_ready:
            return
        with self._lock:
            if self._bucket_ready:
                return
            try:
                self.client.head_bucket(Bucket=self.bucket)
            except Exception:
                self.client.create_bucket(Bucket=self.bucket)
                logger.info("Created bucket %s", self.bucket)
            self._bucket_ready = True

    def put(self, key: str, data: bytes) -> None:
        self._ensure_bucket()
        self.client.put_object(
            Bucket=self.bucket, Key=key, Body=data, ContentType="application/gzip"
        )

    def get(self, key: str) -> bytes:
        self._ensure_bucket()
        return self.client.get_object(Bucket=self.bucket, Key=key)["Body"].read()

    def delete_prefix(self, prefix: str) -> int:
        self._ensure_bucket()
        deleted = 0
        paginator = self.client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=self.bucket, Prefix=prefix):
            objects = [{"Key": item["Key"]} for item in page.get("Contents", [])]
            if objects:
                self.client.delete_objects(Bucket=self.bucket, Delete={"Objects": objects})
                deleted += len(objects)
        return deleted


@lru_cache
def get_object_store() -> ObjectStore:
    return S3ObjectStore()


def chunk_key(project_id: object, session_id: str, seq: int) -> str:
    return f"projects/{project_id}/sessions/{session_id}/{seq:06d}.json.gz"


def session_prefix(project_id: object, session_id: str) -> str:
    return f"projects/{project_id}/sessions/{session_id}/"
