with open("apps/api/src/v3/v3-workspaces.controller.spec.ts", "r") as f:
    content = f.read()

content = content.replace(
    "(prisma.messageActionResponse.findUnique as any).mockResolvedValue(null);",
    "(prisma.messageActionResponse.findUnique as any).mockResolvedValue(null);\n        (prisma.messageActionResponse.findFirst as any).mockResolvedValue(null);"
)

with open("apps/api/src/v3/v3-workspaces.controller.spec.ts", "w") as f:
    f.write(content)

print("Mock resolved values added in tests")
