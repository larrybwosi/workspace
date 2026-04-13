import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function TeamDirectory() {
  const members = [
    { name: 'Marcus Thorne', role: 'Senior Frontend', tag: 'DEV', joined: 'Mar 23', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkUFsRsfQ_Jgv-XJC7WDembosdtYuF3_vXNTNxDlLpBOwMwX4YxV7hX1voFbkYb5hK-4NmQNChcQGVKnTqQ2KHtvuqHF6Bhuw-zfFqLiTZBW3aiyqMV5EGGQ1_HimJMwK1vNYlQQ8y8OeYftJq2fmxYRv3VVqEJQfpDSbm0ioHrP5CaabM_f-Ia9YgDUkQEdyoQAHPN2ra7rgR2rcNKmT5BmdY_6_MbpGpi6Z4CsuqS3Q_2hY28-5MAq47CQ64ObicxM5ANBw8pTQ' },
    { name: 'Sasha Grey', role: 'UX Specialist', tag: 'DESIGN', joined: 'Jan 24', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1fim_WXRWxvOK3Los7Mf7bXZ2TtdJXH_tqwV-7s00Sv0GR7e98LMutfW0uLqBb_VzHfRph9o3uP-7UanL4T7S7GGIN0E5Euk2mwWdCDDe2Wg4puUcMpzh3ZJgwnm7iH1s1Gj7xMRFdC26ZSbS0DYiSxlpKb09B4uf4WC4H20_2Ie7vAKjjeWLIf5cNu8VtAhYMzorZv5t82ItJMrwT0LOiNy9pwF35VDNmiFHzveriGGb6YKEqe873O0Vfk_USVL72AeZNl33xm4' },
    { name: 'Julian Chen', role: 'Backend Architect', tag: 'DEV', joined: 'Jun 22', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNO5VfWnybN-aSmMX_HguwWRnNGGMO5zDsVA1IZlRsnypVi96AJctJ_0b9-sjR3HblMwcHZmHVUv1N6unzwxHjepybZsyPByeVh6XubIbyHM_VCM5n6knc1E4fQ3Qj00LQOtwapyRW4NV0tr7T-Y8dRqk8AtAIoRwxyO-CrsT_LwPQhEhqlVJttpQC3kMeIKbPqz0rJ94Ks4gQn5uFNIXSBkSOKjY9IbKBJK-OWMVPZnHsfkz8ubYDy-iyJKQgIiYb1jQO_atvwJg' },
    { name: 'Maya Patel', role: 'Product Designer', tag: 'DESIGN', joined: 'Nov 23', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVq7_rJ01kKpL3GRhMBVbFDhHXxkqXA2xEqe4hnwrt3NwxxR4sytnHd7HIQ7I7SDmGbq-JrYH_1w0mMdwNCHhmi_XNvWRjebIITCCCqt4XFsj5wHawGJQTgBjuomflIeRYf06J0ZM3xWIMhmrIi-yi8JuXkdVbIT9zCIMG_iZPiaXTN4v0L9KuI67tYCJvK99J7XcpzavAL_tDESioTdQEJEV5zjljeBBwu6LvxdLbNSgSFNxo3cpf8Cb-LsLMNm_bxCgWt_V3vtQ' },
    { name: 'Oliver Reed', role: 'Tech Lead', tag: 'DEV', joined: 'Sep 21', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlehvIdbhOXwmorTFPL5OMK8GfjWd_HUkrazWyiN5xz2DZK3s8P9jWrvH439kNtV3pui8Ersgi_4IM7sgetIBQ74Sr6iabGXmZsi30p1b7S0yNXk3oMy_4HxcNpHWmo_JPDKcghbEU9UEtXM1Y5Xa2sH_5UW225i70QggHbwudF-ZjNWixM6SiWw4SpGHGR4waIFaXySht-eH00wx-ybL-ALu64BD2hh-SYjAU9Eft6c34KGf6aDHCm2xpzHO8dPaxxWOH5cxQpQ4' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="h-16 flex-row items-center justify-between px-4 bg-white border-b border-surface-container">
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-lg overflow-hidden bg-surface-container-highest">
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAci40rjkIE6FS4xN5CeoMJJyVnce0paO5Sfxz6ih_WGWoRmskifJ0tq168OuAj_hO-KbSrKmI14q5dGfkbc8PIOj5u9G4W5Eap1Fv9Wdkm-c4e_qHd89CmEAr5ccgtE23tyJ_CE_0Sh-CH8UtGmDYpCYAv2MZ2VJfEPmuSrKsc0yz_9HdVqlfWsRT77LeKm457cJMS9wGJ-7A2aleEp2oky4SNpSDymaU0wBxhpHUb73TWMR7F31t4aYM9nMvwmAZgvEvpsMPnn8M' }}
              className="w-full h-full"
            />
          </View>
          <Text className="font-body font-semibold text-lg tracking-tight text-on-background">Workspace</Text>
        </View>
        <TouchableOpacity className="p-2">
          <MaterialIcons name="search" size={24} color="#5f5e5e" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <View className="flex-row justify-between items-end mb-6">
            <View>
              <Text className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary mb-1">PROJECT CORE</Text>
              <Text className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">Team Directory</Text>
            </View>
            <TouchableOpacity className="bg-primary px-4 py-2 rounded-lg flex-row items-center gap-2 shadow-sm">
              <MaterialIcons name="person-add" size={18} color="#f7f7ff" />
              <Text className="text-on-primary text-sm font-semibold">Invite Member</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-surface-container p-1 rounded-lg flex-row gap-1 self-start mb-8">
            <TouchableOpacity className="px-4 py-2 bg-surface-container-lowest rounded shadow-sm">
              <Text className="text-on-surface text-[10px] font-bold uppercase">ALL MEMBERS</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-4 py-2 rounded">
              <Text className="text-on-surface-variant text-[10px] font-bold uppercase">DESIGN</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-4 py-2 rounded">
              <Text className="text-on-surface-variant text-[10px] font-bold uppercase">MGMT</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-4 py-2 rounded">
              <Text className="text-on-surface-variant text-[10px] font-bold uppercase">DEV</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-surface-container-lowest p-6 border-l-4 border-primary shadow-sm flex-row gap-6 items-start mb-4">
          <View className="w-32 h-40 bg-surface-container-low rounded-lg overflow-hidden">
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxmNs_I7rfU-yKnyO0hf1O8ngY5J_149W1f7FHZ3bETGrAPymsVDkFI-rZZTxXOEyPExAwApFERs1liO_7GK_8jE6OzUxKVAP4JzbeYFoKCzViuG0hNjCDHAXlyN2LrE06OHGb-7CBPzY2ncIRFd5x0A6xQS_gYnc6AkaVkPPQzY4evuGuD_wBL2rzwpidLjcQUc42IjLm-cZD9Zq1DQt6xT-iNJG0Tg_nFevpDxtypa_ozxXq1hFy5OTs7czQ8dFrSzheyCpNz3E' }}
              className="w-full h-full"
            />
          </View>
          <View className="flex-1">
            <View className="px-2 py-0.5 bg-tertiary-container self-start mb-2 rounded">
              <Text className="text-on-tertiary-container text-[10px] font-bold tracking-tighter">MGMT</Text>
            </View>
            <Text className="text-2xl font-headline font-bold text-on-surface leading-none mb-1">Eleanor Vance</Text>
            <Text className="text-on-surface-variant text-sm font-medium mb-4">Operations & Creative Lead</Text>
            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity className="w-10 h-10 items-center justify-center border border-outline-variant/30 rounded">
                <MaterialIcons name="mail" size={20} color="#5a5e6c" />
              </TouchableOpacity>
              <TouchableOpacity className="w-10 h-10 items-center justify-center border border-outline-variant/30 rounded">
                <MaterialIcons name="call" size={20} color="#5a5e6c" />
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-4 pt-6 border-t border-surface-container">
              <View><Text className="text-[10px] text-outline font-bold uppercase tracking-wider mb-1">Projects</Text><Text className="text-sm font-bold text-on-surface">12 Active</Text></View>
              <View><Text className="text-[10px] text-outline font-bold uppercase tracking-wider mb-1">Perf.</Text><Text className="text-sm font-bold text-on-surface">98%</Text></View>
              <View><Text className="text-[10px] text-outline font-bold uppercase tracking-wider mb-1">TZ</Text><Text className="text-sm font-bold text-on-surface">EST</Text></View>
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-4 mb-4">
          {members.map((member, i) => (
            <View key={i} className="w-[47%] bg-surface-container-lowest p-5 shadow-sm border-b-2 border-surface-container-high rounded-xl">
              <View className="flex-row items-center gap-4 mb-4">
                <View className="w-12 h-12 rounded bg-surface-container-low overflow-hidden">
                  <Image source={{ uri: member.img }} className="w-full h-full" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-on-surface leading-tight text-sm">{member.name}</Text>
                  <Text className="text-[10px] text-on-surface-variant">{member.role}</Text>
                </View>
              </View>
              <View className="flex-row justify-between items-center mb-6">
                <View className={`px-2 py-0.5 ${member.tag === 'DEV' ? 'bg-secondary-container' : 'bg-tertiary-container'} rounded`}>
                  <Text className={`${member.tag === 'DEV' ? 'text-on-secondary-container' : 'text-on-tertiary-container'} text-[8px] font-bold`}>{member.tag}</Text>
                </View>
                <Text className="text-[8px] text-outline-variant font-medium">Joined {member.joined}</Text>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity className="flex-1 py-2 bg-surface-container-low rounded items-center">
                  <Text className="text-primary text-[10px] font-bold">MESSAGE</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View className="flex-row gap-4 mb-10">
          <View className="flex-1 bg-surface-container p-5 rounded-lg">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-outline mb-4">Availability</Text>
            <View className="gap-y-3">
              <View className="flex-row justify-between items-center"><Text className="text-xs font-medium text-on-surface">Eleanor V.</Text><View className="w-2 h-2 rounded-full bg-emerald-500" /></View>
              <View className="flex-row justify-between items-center"><Text className="text-xs font-medium text-on-surface">Marcus T.</Text><View className="w-2 h-2 rounded-full bg-amber-400" /></View>
              <View className="flex-row justify-between items-center opacity-50"><Text className="text-xs font-medium text-on-surface">Sasha G.</Text><View className="w-2 h-2 rounded-full bg-surface-variant" /></View>
            </View>
          </View>
          <View className="flex-1 bg-primary p-5 rounded-lg">
            <Text className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2 text-white">Capacity</Text>
            <Text className="text-3xl font-headline font-extrabold mb-1 text-white">84%</Text>
            <Text className="text-[8px] opacity-80 text-white">4 seats remaining for Q3 hiring phase.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
