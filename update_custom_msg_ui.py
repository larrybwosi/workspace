with open("packages/ui/src/features/chat/message-types/custom-message.tsx", "r") as f:
    content = f.read()

# Update CustomMessageActions props and rendering
old_actions_comp = """const CustomMessageActions = memo(({
  actions,
  formValues,
  data,
  handleAction,
  loadingAction,
  externalLoading
}: {
  actions: any[],
  formValues: any,
  data: any,
  handleAction: (action: any) => void,
  loadingAction: string | null,
  externalLoading: boolean
}) => {"""

new_actions_comp = """const CustomMessageActions = memo(({
  actions,
  formValues,
  data,
  handleAction,
  loadingAction,
  externalLoading,
  respondedActionIds,
}: {
  actions: any[],
  formValues: any,
  data: any,
  handleAction: (action: any) => void,
  loadingAction: string | null,
  externalLoading: boolean,
  respondedActionIds: Set<string>,
}) => {"""

old_state = """  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [formValues, setFormValues] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});"""

new_state = """  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [formValues, setFormValues] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [respondedActionIds, setRespondedActionIds] = React.useState<Set<string>>(() => {
    const set = new Set<string>();
    if (Array.isArray(message.actionResponses)) {
      message.actionResponses.forEach((r: any) => {
        if (r.actionId) set.add(r.actionId);
        if (r.actionValue) set.add(r.actionValue);
      });
    }
    return set;
  });"""

old_handle_action = """        await onAction(action.id, payload);
      }
    } catch (e) {"""

new_handle_action = """        await onAction(action.id, payload);
        setRespondedActionIds(prev => new Set(prev).add(action.id));
      }
    } catch (e) {"""

old_usage = """            {actions.length > 0 && !readOnly && (
              <CustomMessageActions
                actions={actions}
                formValues={formValues}
                data={data}
                handleAction={handleAction}
                loadingAction={loadingAction}
                externalLoading={externalLoading}
              />
            )}"""

new_usage = """            {actions.length > 0 && !readOnly && (
              <CustomMessageActions
                actions={actions}
                formValues={formValues}
                data={data}
                handleAction={handleAction}
                loadingAction={loadingAction}
                externalLoading={externalLoading}
                respondedActionIds={respondedActionIds}
              />
            )}"""

content = content.replace(old_state, new_state)
content = content.replace(old_handle_action, new_handle_action)
content = content.replace(old_usage, new_usage)

# Construct CustomMessageActions component cleanly
end_idx = content.find("CustomMessageActions.displayName = 'CustomMessageActions';")
start_idx = content.find("const CustomMessageActions = memo")

actions_block = """const CustomMessageActions = memo(({
  actions,
  formValues,
  data,
  handleAction,
  loadingAction,
  externalLoading,
  respondedActionIds,
}: {
  actions: any[],
  formValues: any,
  data: any,
  handleAction: (action: any) => void,
  loadingAction: string | null,
  externalLoading: boolean,
  respondedActionIds: Set<string>,
}) => {
  const { customIcons } = useUI();
  return (
    <div className="p-4 border-t bg-card/30 flex flex-wrap gap-2">
      {actions
        .filter(action => evaluateCondition(action.condition, formValues, data))
        .map(action => {
          const allowMultiple = action.allowMultipleResponses ?? action.allowMultiple ?? false;
          const isResponded = respondedActionIds.has(action.id);
          const isDisabled = (isResponded && !allowMultiple) || loadingAction !== null || externalLoading;

          return (
            <Button
              key={action.id}
              variant={
                isResponded && !allowMultiple
                  ? 'secondary'
                  : action.type === 'PRIMARY'
                    ? 'default'
                    : action.type === 'DESTRUCTIVE'
                      ? 'destructive'
                      : action.type === 'GHOST'
                        ? 'ghost'
                        : 'outline'
              }
              size="sm"
              className="flex-1 sm:flex-none h-9 gap-2"
              onClick={() => handleAction(action)}
              disabled={isDisabled}
            >
              {(loadingAction === action.id || (externalLoading && !loadingAction)) ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isResponded && !allowMultiple ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                getIcon(action.icon, 'w-3.5 h-3.5', customIcons)
              )}
              {resolveVariables(action.label, data, formValues)}
              {isResponded && !allowMultiple && <span className="text-xs opacity-75">(Submitted)</span>}
            </Button>
          );
        })}
    </div>
  );
});"""

content = content[:start_idx] + actions_block + content[end_idx + len("CustomMessageActions.displayName = 'CustomMessageActions';"):]

with open("packages/ui/src/features/chat/message-types/custom-message.tsx", "w") as f:
    f.write(content)

print("Updated custom-message.tsx")
