with open("apps/api/src/v3/v3-workspaces.controller.ts", "r") as f:
    content = f.read()

old_logic = """    const existingResponse = await prisma.messageActionResponse.findUnique({
      where: {
        actionId_userId: {
          actionId: action.id,
          userId,
        },
      },
    });

    if (existingResponse) {
      throw new BadRequestException('Action already responded by this user');
    }

    const callbackUrl =
      (message.metadata as any)?.callbackUrl ||
      (message.metadata as any)?.customMessage?.metadata?.callbackUrl ||
      (action as any)?.handler?.url;"""

new_logic = """    const customMsgActions = (message.metadata as any)?.customMessage?.actions || (message.metadata as any)?.actions;
    const metaAct = Array.isArray(customMsgActions)
      ? customMsgActions.find((a: any) => a.id === actionIdParam || a.actionId === actionIdParam)
      : null;

    const allowMultiple =
      metaAct?.allowMultipleResponses ??
      metaAct?.allowMultiple ??
      (message.metadata as any)?.allowMultipleResponses ??
      false;

    if (!allowMultiple) {
      const existingResponse = await prisma.messageActionResponse.findFirst({
        where: {
          actionId: action.id,
          userId,
        },
      });

      if (existingResponse) {
        throw new BadRequestException('Action already responded by this user');
      }
    }

    let callbackUrl =
      (message.metadata as any)?.callbackUrl ||
      (message.metadata as any)?.customMessage?.metadata?.callbackUrl ||
      (action as any)?.handler?.url;

    if (!callbackUrl && (message as any).user?.isBot) {
      const app = await prisma.application.findFirst({
        where: { botId: (message as any).userId },
        select: { interactionsUrl: true },
      });
      if (app?.interactionsUrl) {
        callbackUrl = app.interactionsUrl;
      }
    }"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open("apps/api/src/v3/v3-workspaces.controller.ts", "w") as f:
        f.write(content)
    print("Updated v3-workspaces.controller.ts")
