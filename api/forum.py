from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/forum", tags=["forum"])

FORUM_DATA_FILE = "data/forum_data.json"

class Comment(BaseModel):
    id: str
    thread_id: str
    parent_id: Optional[str] = None
    content: str
    author: str
    timestamp: str

class Thread(BaseModel):
    id: str
    title: str
    content: str
    author: str
    timestamp: str
    tags: List[str] = []
    comments: List[Comment] = []

class ThreadCreate(BaseModel):
    title: str
    content: str
    author: Optional[str] = "Anonymous"
    tags: List[str] = []

class CommentCreate(BaseModel):
    content: str
    author: Optional[str] = "Anonymous"
    parent_id: Optional[str] = None

def load_data():
    if not os.path.exists(FORUM_DATA_FILE):
        return []
    try:
        with open(FORUM_DATA_FILE, "r") as f:
            return json.load(f)
    except:
        return []

def save_data(data):
    os.makedirs(os.path.dirname(FORUM_DATA_FILE), exist_ok=True)
    with open(FORUM_DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

@router.get("/threads", response_model=List[Thread])
def get_threads():
    threads = load_data()
    # Return threads sorted by timestamp (newest first)
    return sorted(threads, key=lambda x: x['timestamp'], reverse=True)

@router.post("/threads", response_model=Thread)
def create_thread(thread: ThreadCreate):
    threads = load_data()
    new_thread = {
        "id": str(uuid.uuid4())[:8],
        "title": thread.title,
        "content": thread.content,
        "author": thread.author or "Anonymous",
        "timestamp": datetime.now().isoformat(),
        "tags": thread.tags,
        "comments": []
    }
    threads.append(new_thread)
    save_data(threads)
    return new_thread

@router.post("/threads/{thread_id}/comments", response_model=Comment)
def create_comment(thread_id: str, comment: CommentCreate):
    threads = load_data()
    for t in threads:
        if t["id"] == thread_id:
            new_comment = {
                "id": str(uuid.uuid4())[:8],
                "thread_id": thread_id,
                "parent_id": comment.parent_id,
                "content": comment.content,
                "author": comment.author or "Anonymous",
                "timestamp": datetime.now().isoformat()
            }
            t["comments"].append(new_comment)
            save_data(threads)
            return new_comment
    raise HTTPException(status_code=404, detail="Thread not found")
