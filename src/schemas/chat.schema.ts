import { z } from 'zod';

export const create_chat_schema = z.object({
  body: z.object({
    members: z
      .array(z.string().uuid({ message: 'Each member ID must be a valid UUID' }))
      .min(1, 'At least 1 member ID is required.'),
    group_name: z
      .string()
      .min(1, 'Group name cannot be empty.')
      .max(100, 'Group name must be 100 characters or less.')
      .optional(), // If this is not present, it's a DM
  })
})

export const update_chat_schema = z.object({
  params: z.object({
    chat_id: z.string().uuid({ message: 'Chat ID must be a valid UUID.' }),
  }),
  body: z.object({
    group_name: z
      .string()
      .min(1, 'Group name cannot be empty.')
      .max(100, 'Group name must be 100 characters or less.')
      .optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: "At least one field (group_name or group_avatar_url) must be provided for an update."
  }),
});

export const add_member_schema = z.object({
  params: z.object({
    chat_id: z.string().uuid({ message: 'Chat ID must be a valid UUID.' }),
  }),
  body: z.object({
    user_id: z.string().uuid({ message: 'User ID must be a valid UUID.' }),
  }),
});

export const remove_member_schema = z.object({
  params: z.object({
    chat_id: z.string().uuid({ message: 'Chat ID must be a valid UUID.' }),
    user_id: z.string().uuid({ message: 'User ID must be a valid UUID.' }),
  }),
});

export const mark_as_read_schema = z.object({
  params: z.object({
    chat_id: z.string().uuid({ message: 'Chat ID must be a valid UUID.' }),
  }),
});

export const get_chat_details_schema = z.object({
  params: z.object({
    chat_id: z.string().uuid({ message: 'Chat ID must be a valid UUID.' }),
  }),
});

export type CreateChatInput = z.infer<typeof create_chat_schema>['body'];
export type UpdateChatInput = z.infer<typeof update_chat_schema>['body'];
export type AddMemberInput = z.infer<typeof add_member_schema>['body'];