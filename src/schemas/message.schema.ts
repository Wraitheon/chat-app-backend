import { z } from 'zod';

export const get_messages_schema = z.object({
  params: z.object({
    chat_id: z.string().uuid({ message: 'Chat ID must be a valid UUID.' }),
  }),
});

export type GetMessagesParams = z.infer<typeof get_messages_schema>['params'];