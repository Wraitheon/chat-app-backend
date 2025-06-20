import { z } from 'zod';

/**
 * Schema for validating the request to fetch messages for a chat.
 * It only validates the `chatId` from the URL path.
 */
export const get_messages_schema = z.object({
  params: z.object({
    chat_id: z.string().uuid({ message: 'Chat ID must be a valid UUID.' }),
  }),
});

// Export the inferred type for our controller
export type GetMessagesParams = z.infer<typeof get_messages_schema>['params'];