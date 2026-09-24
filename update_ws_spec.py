with open("apps/api/src/v3/v3-workspaces.controller.spec.ts", "r") as f:
    content = f.read()

if "findFirst:" not in content:
    content = content.replace("findUnique: vi.fn(),", "findUnique: vi.fn(),\n      findFirst: vi.fn(),")
    with open("apps/api/src/v3/v3-workspaces.controller.spec.ts", "w") as f:
        f.write(content)

print("Updated mock in v3-workspaces.controller.spec.ts")
