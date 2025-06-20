import { z } from 'zod';

export const update_user_schema = z.object({
  body: z.object({
    display_name: z
      .string()
      .min(1, 'Display name cannot be empty.')
      .max(30, 'Display name must be 30 characters or less.')
      .optional(),
    status_message: z
      .string()
      .max(100, 'Status must be 100 characters or less.')
      .optional(),
    display_picture_url: z
      .string()
      .url({ message: 'Must be a valid URL.' })
      .optional(),
  }),
});

export const search_user_schema = z.object({
  query: z.object({
    search: z
      .string()
      .min(1, 'Search query cannot be empty.')
      .max(50, 'Search query must be 50 characters or less.'),
  }),
})

export type UpdateUserInput = z.infer<typeof update_user_schema>['body'];
export type SearchUsersQuery = z.infer<typeof search_user_schema>['query'];