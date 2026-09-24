for filepath in ["packages/shared/src/messages/custom-message-schema.ts", "packages/sdk/src/custom-message-schema.ts"]:
    try:
        with open(filepath, "r") as f:
            content = f.read()
        if "allowMultipleResponses" not in content:
            target = "condition: ConditionSchema.optional(),"
            replacement = "allowMultipleResponses: z.boolean().optional(),\n  allowMultiple: z.boolean().optional(),\n  condition: ConditionSchema.optional(),"
            content = content.replace(target, replacement)
            with open(filepath, "w") as f:
                f.write(content)
            print(f"Updated {filepath}")
    except Exception as e:
        print(f"Error on {filepath}: {e}")
