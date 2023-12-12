
export interface PersonType {
  first_name: string
  last_name: string
  age: number
  auth: Authority
}
 
export type Authority = "OWNER" | "ADMINISTRATOR" | "MEMBER" | "CUSTOM"
 
export interface UserTable {
  id: string
  username: string
  password_hash: string
  description?: string
  picture?: string
}
 
export interface PostTable {
  id: string
  author_id?: string
  title: string
  content?: string
  created_at: Date | string
  updated_at: Date | string
  attachment_url?: string
}
 
export interface PostCommentTable {
  id: string
  author_id?: string
  post_id?: string
  content?: string
  created_at: Date | string
  updated_at: Date | string
  randomObj: PersonType
}
 
export interface PostUpvoteTable {
  id: string
  user_id?: string
  post_id?: string
}
 
export interface PostDownvoteTable {
  id: string
  user_id?: string
  post_id?: string
}
 
export interface CommunityTable {
  id: string
  name: string
  description: string
  member_count?: number
  created_at: Date | string
  updated_at: Date | string
}
 
export interface CommunityRoleTable {
  id: string
  community_id?: string
  name: string
  role_authority: Authority
}
 
export interface CommunityMemberTable {
  id: string
  user_id?: string
  community_id?: string
  community_role_id: string
  created_at: Date | string
}
 
export interface CommunityPostTable {
  id: string
  community_id?: string
  post_id: string
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
