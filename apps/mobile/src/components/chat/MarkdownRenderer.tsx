import React from 'react';
import { View, Text, Linking } from 'react-native';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content into blocks: code blocks vs normal text
  const blocks = content.split(/(^\s*```[\s\S]*?```\s*$)/gm);

  return (
    <View>
      {blocks.map((block, index) => {
        if (block.trim().startsWith('```')) {
          const match = block.match(/^\s*```([a-zA-Z0-9+#\-.]+)?\s+([\s\S]+?)```\s*$/);
          if (match) {
            const language = match[1] || 'text';
            const code = match[2];
            return (
              <View key={index} className="bg-discord-tertiary rounded-lg p-3 my-2 border border-black/20">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-discord-muted text-xs font-bold uppercase">{language}</Text>
                </View>
                <Text className="text-discord-header font-mono text-sm leading-5">{code.trim()}</Text>
              </View>
            );
          }
        }

        return <RichText key={index} text={block} />;
      })}
    </View>
  );
}

function RichText({ text }: { text: string }) {
  if (!text) return null;

  // Simple regex for inline formatting
  // Groups: 1: bold (**), 2: italic (*), 3: inline code (`), 4: link ([text](url))
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);

  return (
    <Text className="text-discord-header text-base leading-5">
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={index} className="font-bold">
              {part.slice(2, -2)}
            </Text>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <Text key={index} className="italic">
              {part.slice(1, -1)}
            </Text>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <Text key={index} className="bg-black/20 rounded px-1 font-mono text-sm">
              {part.slice(1, -1)}
            </Text>
          );
        }
        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
          return (
            <Text key={index} className="text-blue-400 underline" onPress={() => Linking.openURL(linkMatch[2])}>
              {linkMatch[1]}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}
