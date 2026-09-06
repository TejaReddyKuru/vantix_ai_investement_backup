import httpx
import sys

def main():
    try:
        r = httpx.get('http://127.0.0.1:8000/health', timeout=5.0)
        print(r.status_code)
        print(r.text)
    except Exception as e:
        print('ERROR', e)
        sys.exit(1)

if __name__ == '__main__':
    main()
