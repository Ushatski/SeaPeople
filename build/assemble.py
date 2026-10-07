"""Assemble index.html for SEA PEOPLE from build/ sources + assets."""
import json, os, sys

BASE = os.path.dirname(os.path.abspath(__file__))          # /workspace/build
ROOT = os.path.dirname(BASE)                                # /workspace
TEMPLATE = os.environ.get('SEA_TEMPLATE', '/tmp/build/template_head.html')
ASSETS   = os.environ.get('SEA_ASSETS',   '/tmp/build/assets.json')

def main():
    assets = json.load(open(ASSETS))
    head = open(TEMPLATE).read()
    assert head.rstrip().endswith('const ASSETS = {'), 'unexpected template tail'
    head = head.rstrip()[:-len('const ASSETS = {')] + 'const ASSETS = '

    js1 = open(os.path.join(BASE, 'js1.js')).read().strip('\n')
    js2 = open(os.path.join(BASE, 'js2.js')).read().strip('\n')
    rt  = open(os.path.join(BASE, 'runtime.js')).read().strip('\n')

    # hoist the SVG layer creation above relayout() (js1 calls it at top level)
    svgdef = ("/* ---------- SVG layer (defined early: relayout below references it) ---------- */\n"
              "var NS='http://www.w3.org/2000/svg';\n"
              "var svgLayer=document.createElement('div'); svgLayer.id='svgLayer';\n"
              "var svg=document.createElementNS(NS,'svg');\n"
              "svg.setAttribute('xmlns',NS);\n"
              "svg.style.cssText='width:100%;height:100%;position:absolute;left:0;top:0;overflow:visible';\n"
              "svgLayer.appendChild(svg); $('shopLayer').appendChild(svgLayer);\n")
    marker = "/* ---------- layout & camera ---------- */"
    assert marker in js1
    js1 = js1.replace(marker, svgdef + "\n" + marker, 1)

    dup = ("var NS='http://www.w3.org/2000/svg';\n"
           "var svgLayer=document.createElement('div'); svgLayer.id='svgLayer';\n"
           "var svg=document.createElementNS(NS,'svg');\n"
           "svg.setAttribute('xmlns',NS);\n"
           "svg.style.cssText='width:100%;height:100%;position:absolute;left:0;top:0;overflow:visible';\n"
           "svgLayer.appendChild(svg); $('shopLayer').appendChild(svgLayer);\n")
    assert dup in js2
    js2 = js2.replace(dup, '', 1)

    html = head + json.dumps(assets, separators=(',', ':')) + ';\n\n' + js1 + '\n\n' + js2 + '\n\n' + rt + '\n</script>\n</body>\n</html>\n'
    out = os.path.join(ROOT, 'index.html')
    open(out, 'w').write(html)
    print('wrote', out, len(html), 'bytes')

if __name__ == '__main__':
    main()
