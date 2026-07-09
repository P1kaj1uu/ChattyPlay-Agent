import json, subprocess, time, os, sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, 'config.json')
STATUS_FILE = os.path.join(BASE_DIR, 'status.json')


def load_config():
    with open(CONFIG_FILE) as f:
        return json.load(f)


def get_sessions():
    try:
        result = subprocess.run(
            ['openclaw', 'sessions', 'list', '--json'],
            capture_output=True, text=True, timeout=10
        )
        data = json.loads(result.stdout)
        return data.get('sessions', data) if isinstance(data, dict) else data
    except Exception as e:
        print(f"  Warning: Could not get sessions: {e}", file=sys.stderr)
        return []


def match_session(agent, sessions):
    pattern = agent.get('sessionMatch', '')
    if not pattern:
        return None
    for s in sessions:
        key = s.get('key', '') + '|' + s.get('displayName', '')
        if pattern in key:
            return s
    return None


def determine_status(age_min):
    if age_min < 2:
        return 'busy'
    elif age_min < 10:
        return 'online'
    elif age_min < 60:
        return 'idle'
    return 'offline'


def extract_last_message(session):
    for msg in reversed(session.get('messages', [])):
        content = msg.get('content', '')
        if isinstance(content, list):
            for c in content:
                if isinstance(c, dict) and c.get('type') == 'text':
                    text = c['text'].strip()
                    if text and len(text) > 2:
                        return text[:80]
        elif isinstance(content, str) and len(content.strip()) > 2:
            return content.strip()[:80]
    return '...'


def refresh():
    config = load_config()
    sessions = get_sessions()
    now = time.time() * 1000

    agents_out = []
    for agent in config.get('agents', []):
        s = match_session(agent, sessions)
        if s:
            updated = s.get('updatedAt', 0)
            age_min = int((now - updated) / 60000) if updated else 999
            status = determine_status(age_min)
            task = extract_last_message(s)

            agents_out.append({
                'id': agent['id'],
                'name': agent['name'],
                'sprite': agent.get('sprite', 'desk-with-pc.png'),
                'role': agent.get('role', ''),
                'status': status,
                'task': task,
                'lastActive': age_min,
                'session': s.get('key'),
                'tokens': s.get('totalTokens', 0),
            })
        else:
            agents_out.append({
                'id': agent['id'],
                'name': agent['name'],
                'sprite': agent.get('sprite', 'desk-with-pc.png'),
                'role': agent.get('role', ''),
                'status': 'offline',
                'task': '尚未建立 session',
                'lastActive': -1,
                'session': None,
                'tokens': 0,
            })

    output = {
        'title': config.get('title', 'OpenClaw Virtual Office'),
        'timestamp': int(now),
        'agents': agents_out,
    }

    with open(STATUS_FILE, 'w') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    online = sum(1 for a in agents_out if a['status'] != 'offline')
    print(f"[{time.strftime('%H:%M:%S')}] {online}/{len(agents_out)} agents active")


def main():
    if '--loop' in sys.argv:
        idx = sys.argv.index('--loop')
        interval = int(sys.argv[idx + 1]) if idx + 1 < len(sys.argv) else 30
        print(f"Refreshing every {interval}s. Press Ctrl+C to stop.")
        while True:
            try:
                refresh()
                time.sleep(interval)
            except KeyboardInterrupt:
                break
    else:
        refresh()


if __name__ == '__main__':
    main()
