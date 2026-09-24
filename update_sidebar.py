with open("apps/docs/src/components/sidebar.tsx", "r") as f:
    content = f.read()

target = "{ href: '/user-guide/custom-messages', label: 'Custom Messages', category: 'Basics' },"
replacement = "{ href: '/user-guide/custom-messages', label: 'Custom Messages', category: 'Basics' },\n        { href: '/user-guide/message-actions-integration', label: 'Message Actions & Interactions', category: 'Integrations' },"

if target in content and "/user-guide/message-actions-integration" not in content:
    content = content.replace(target, replacement)
    with open("apps/docs/src/components/sidebar.tsx", "w") as f:
        f.write(content)
    print("Sidebar updated")
