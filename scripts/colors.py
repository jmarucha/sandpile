hex((num & 0x00ff0000) >> 16)
hex((num & 0x0000ff00) >> 8)
hex((num & 0x000000ff))

COLORS = [
  0xff000000, # 0: black
  0xff552200, # 1: dark brown
  0xff0055aa, # 2: teal
  0xff00aaff, # 3: orange
  0xff00ddff, # 4: yellow
  0xff44ffff, # 5: bright yellow
  0xffffffff, # 6: white
  0xffff88ff, # 7: pink
  0xffff44ff, # 8+: magenta
  0xffff33ff,
  0xffff22ff,
  0xffff11ff,
  0xffff00ff,
  0xffdd00dd,
  0xffaa00aa,
  0xff990099,
  0xff550055,
]

def toGLSL(num):
    b = (num & 0x00ff0000) >> 16
    g = (num & 0x0000ff00) >> 8
    r = (num & 0x000000ff)
    return f"vec3({r/255:.2f}, {g/255:.2f}, {b/255:.2f}),"

print('\n'.join(toGLSL(c) for c in COLORS))