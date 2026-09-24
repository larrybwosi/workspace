with open("apps/api/src/v3/v3-workspaces.controller.spec.ts", "r") as f:
    content = f.read()

target = """    messageActionResponse: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },"""

replacement = """    messageActionResponse: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },"""

content = content.replace(target, replacement)
with open("apps/api/src/v3/v3-workspaces.controller.spec.ts", "w") as f:
    f.write(content)

print("Updated mock in v3-workspaces.controller.spec.ts")
