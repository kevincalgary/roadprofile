import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { relativeTime } from '../../lib/format';
import type { Message } from '../../lib/types/database';

export function MessageBubble({ message, isMine, read }: { message: Message; isMine: boolean; read: boolean }) {
  return (
    <View className={['max-w-[78%] mb-2', isMine ? 'self-end items-end' : 'self-start items-start'].join(' ')}>
      <View className={['rounded-2xl px-4 py-2.5', isMine ? 'bg-mint rounded-br-md' : 'bg-cardgray dark:bg-dark-card rounded-bl-md'].join(' ')}>
        {message.shared_object_type ? (
          <View className="flex-row items-center gap-2">
            <Feather name="link" size={14} color={isMine ? '#0F2518' : '#5C6470'} />
            <Text className={isMine ? 'text-mint-900 text-sm' : 'text-charcoal dark:text-dark-text text-sm'}>
              Shared a {message.shared_object_type}
            </Text>
          </View>
        ) : (
          <Text className={isMine ? 'text-mint-900' : 'text-charcoal dark:text-dark-text'}>{message.body}</Text>
        )}
      </View>
      <View className="flex-row items-center gap-1 mt-1 px-1">
        <Text className="text-[10px] text-asphalt dark:text-dark-textSecondary">{relativeTime(message.created_at)}</Text>
        {isMine ? <Feather name={read ? 'check-circle' : 'check'} size={10} color="#8A919B" /> : null}
      </View>
    </View>
  );
}
