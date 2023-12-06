
export type Authority = "OWNER" | "ADMINISTRATOR" | "MEMBER" | "CUSTOM"
 
export interface UserTable {
  id: string | Generated<string>
  username: string | Generated<string>
  password_hash: string | Generated<string>
  description?: string | Generated<string>
  picture?: string | Generated<string>
}
 
export interface PostTable {
  id: string | Generated<string>
  author_id?: string
  title: string | Generated<string>
  content?: string | Generated<string>
  created_at: Date | string | Generated<Date | string>
  updated_at: Date | string | Generated<Date | string>
  attachment_url?: string | Generated<string>
}
 
export interface PostCommentTable {
  id: string | Generated<string>
  author_id?: string
  post_id?: string
  content?: string | Generated<string>
  created_at: Date | string | Generated<Date | string>
  updated_at: Date | string | Generated<Date | string>
}
 
export interface PostUpvoteTable {
  id: string | Generated<string>
  user_id?: string
  post_id?: string
}
 
export interface PostDownvoteTable {
  id: string | Generated<string>
  user_id?: string
  post_id?: string
}
 
export interface CommunityTable {
  id: string | Generated<string>
  name: string | Generated<string>
  description: string | Generated<string>
  member_count?: number | Generated<number>
  created_at: Date | string | Generated<Date | string>
  updated_at: Date | string | Generated<Date | string>
}
 
export interface CommunityRoleTable {
  id: string | Generated<string>
  community_id?: string
  name: string | Generated<string>
  role_authority: Authority | Generated<Authority>
}
 
export interface CommunityMemberTable {
  id: string | Generated<string>
  user_id?: string
  community_id?: string
  community_role_id: string | Generated<string>
  created_at: Date | string | Generated<Date | string>
}
 
export interface CommunityPostTable {
  id: string | Generated<string>
  community_id?: string
  post_id: string | Generated<string>
  community_member_id?: string
}
 
export interface Database {
  user: UserTable
  post: PostTable
  post_comment: PostCommentTable
  post_upvote: PostUpvoteTable
  post_downvote: PostDownvoteTable
  community: CommunityTable
  community_role: CommunityRoleTable
  community_member: CommunityMemberTable
  community_post: CommunityPostTable
}
