with open("apps/api/src/v3/v3-workspaces.controller.ts", "r") as f:
    content = f.read()

target = """    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        actions: true,
        channel: true,
      },
    });"""

replacement = """    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        actions: true,
        channel: true,
        user: true,
      },
    });"""

content = content.replace(target, replacement)
with open("apps/api/src/v3/v3-workspaces.controller.ts", "w") as f:
    f.write(content)

print("Updated message query in v3-workspaces.controller.ts")
