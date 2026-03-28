import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import database as db
import sourcing
import hrflow_client as hrflow
import uvicorn
import os
app = FastAPI()
if not os.path.exists("static"): os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_index():
    with open("static/index.html", encoding="utf-8") as f: return f.read()

@app.post("/search")
@app.post("/search")
async def perform_search(request: Request):
    try:
        data = await request.json()
        query = data.get("query")
        if not query:
            return {"status": "error", "message": "请输入搜索关键词"}

        print(f"🔍 正在为岗位创建索引: {query}")
        # 1. 创建 Job (这一步会让 Board Key 计数)
        job_key = await hrflow.index_job(query)

        # 2. 给 AI 一点反应时间 (因为没有了爬虫过程，建议保留几秒等待)
        print("⏳ 正在请求 HrFlow AI 计算匹配得分...")
        await asyncio.sleep(5)

        # 3. 直接获取评分结果 (搜索 Source 中已有的所有人)
        full_response = await hrflow.score_profiles(job_key)

        # 解析数据
        api_data = full_response.get('data', {})
        profiles = api_data.get('profiles', [])
        predictions = api_data.get('predictions', [])

        results = []
        for i, profile in enumerate(profiles):
            info = profile.get('info', {})

            # 提取姓名
            display_name = info.get('full_name') or profile.get('reference') or "未知候选人"

            # 提取分数
            score_percent = "0%"
            if i < len(predictions) and len(predictions[i]) > 1:
                score_percent = f"{round(predictions[i][1] * 100, 2)}%"

            # 提取链接
            link = "#"
            for u in info.get('urls', []):
                if isinstance(u, dict) and u.get('url'):
                    link = u['url']
                    break

            results.append({
                "name": display_name,
                "score": score_percent,
                "url": link,
                "summary": info.get('summary') or "暂无个人简介"
            })

        print(f"✅ 成功找到 {len(results)} 位匹配的人才")
        return {"status": "success", "results": results}

    except Exception as e:
        print(f"❌ 搜索出错: {str(e)}")
        return {"status": "error", "message": str(e)}
@app.get("/history")
async def get_history(): return db.get_recent_searches()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)