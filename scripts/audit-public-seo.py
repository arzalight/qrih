"""Read-only audit of the documented QRIH staging origin. No cookies or credentials."""
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ORIGIN = 'https://qrih-staging.netlify.app'


class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.result = {'titles': [], 'h1': [], 'meta': [], 'canonical': [],
                       'jsonld': 0, 'images': 0, 'images_without_alt': 0}
        self.capture = None
        self.links = []

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        if tag in ['title', 'h1']:
            self.capture = tag
            self.result['titles' if tag == 'title' else 'h1'].append('')
        if tag == 'meta' and (attr.get('name') in ['robots', 'description']
                              or attr.get('property', '').startswith('og:')):
            self.result['meta'].append(attr)
        if tag == 'link' and attr.get('rel') == 'canonical':
            self.result['canonical'].append(attr.get('href'))
        if tag == 'script' and attr.get('type') == 'application/ld+json':
            self.result['jsonld'] += 1
        if tag == 'img':
            self.result['images'] += 1
            self.result['images_without_alt'] += not bool(attr.get('alt'))
        if tag == 'a' and attr.get('href', '').startswith('/bodegas/'):
            self.links.append(attr['href'])

    def handle_data(self, text):
        if self.capture:
            self.result['titles' if self.capture == 'title' else 'h1'][-1] += text

    def handle_endtag(self, tag):
        if tag == self.capture:
            self.capture = None


def fetch(path):
    record = {'path': path}
    links = []
    try:
        with urllib.request.urlopen(ORIGIN + path, timeout=12) as response:
            body = response.read(500000).decode('utf-8', 'replace')
            record.update(status=response.status, x_robots_tag=response.headers.get('X-Robots-Tag'),
                          cache_control=response.headers.get('Cache-Control'), final_url=response.url)
            audit = Audit()
            audit.feed(body)
            record.update(audit.result)
            record['analytics_markers'] = bool(re.search(r'googletagmanager.com|google-analytics.com|gtag\s*\(', body))
            links = audit.links
    except Exception as error:
        record.update(status=getattr(error, 'code', None), error=type(error).__name__)
    return record, links


if __name__ == '__main__':
    paths = ['/', '/inventario', '/inventario?operation=Renta', '/robots.txt', '/sitemap.xml',
             '/bodegas/qrih-audit-missing-20261027', '/login']
    with ThreadPoolExecutor(max_workers=4) as pool:
        records = list(pool.map(fetch, paths))
    # A real property GET may increment the site's existing property-view counter.
    if records[0][1]:
        records.append(fetch(records[0][1][0]))
    result = {'checked_at_utc': datetime.now(timezone.utc).isoformat(), 'origin': ORIGIN,
              'kind': 'Existing remote deployment; changes are local only',
              'pages': [record for record, _ in records]}
    target = Path(__file__).resolve().parents[1] / 'docs/ADMIN_SEO_REMOTE_AUDIT_2026-10-27.json'
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))
