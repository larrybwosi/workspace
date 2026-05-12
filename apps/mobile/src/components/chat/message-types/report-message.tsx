import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export function ReportMessage({ message, metadata }: any) {
  const reportData = metadata?.reportData || {};
  const status = reportData.status || 'draft';

  return (
    <View className="bg-discord-tertiary rounded-lg border border-black/20 my-2 overflow-hidden">
      <View className="bg-discord-secondary p-4 border-b border-black/10 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <MaterialIcons name="bar-chart" size={24} color="#5865F2" />
          <View className="ml-3 flex-1">
            <Text className="text-discord-header font-bold" numberOfLines={1}>
              {reportData.title || 'Analytics Report'}
            </Text>
            <Text className="text-discord-muted text-xs">{reportData.date || 'Today'}</Text>
          </View>
        </View>
        <View className="bg-discord-base px-2 py-0.5 rounded-md">
          <Text className="text-[10px] text-discord-header font-bold uppercase">{status}</Text>
        </View>
      </View>

      <View className="p-4">
        <View className="bg-discord-base p-3 rounded-lg border border-black/10 mb-4">
          <Text className="text-discord-header text-xs font-bold mb-1 uppercase opacity-70">Summary</Text>
          <Text className="text-discord-header text-sm leading-5">{reportData.summary || message.content}</Text>
        </View>

        {reportData.kpis && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {reportData.kpis.slice(0, 2).map((kpi: any, idx: number) => (
              <View
                key={idx}
                className="bg-discord-secondary p-3 rounded-lg border border-black/10 flex-1 min-w-[120px]"
              >
                <Text className="text-discord-muted text-[10px] font-bold uppercase mb-1">{kpi.label}</Text>
                <Text className="text-discord-header font-bold text-lg">
                  {kpi.value}
                  {kpi.unit}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity className="bg-discord-blurple py-2 rounded-md items-center flex-row justify-center">
          <MaterialIcons name="file-download" size={18} color="white" />
          <Text className="text-white font-bold ml-2">Download PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
