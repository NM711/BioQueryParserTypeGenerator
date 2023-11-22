
enum AUTHORITY {
  OWNER = 'OWNER',
  ADMINISTRATOR = 'ADMINISTRATOR',
  MEMBER = 'MEMBER',

}
 
interface TABLE_USER {
  id: string
  username: string
  password_hash: string
}
 
interface TABLE_PROFILE {
  id: string
  user_id: string
  description: string
  picture: string
}
 
interface TABLE_POST {
  id: string
  author_id: string
  title: string
  content: string
  created_at: string | Date
  updated_at: string | Date
  attachment_url: string
}
 
interface TABLE_POST_COMMENT {
  id: string
  author_id: string
  post_id: string
  content: string
  created_at: string | Date
  updated_at: string | Date
}
 
interface TABLE_POST_UPVOTE {
  id: string
  user_id: string
  post_id: string
}
 
interface TABLE_POST_DOWNVOTE {
  id: string
  user_id: string
  post_id: string
}
 
interface TABLE_COMMUNITY {
  id: string
  name: string
  description: string
  member_count: number
  created_at: string | Date
  updated_at: string | Date
}
 
interface TABLE_COMMUNITY_ROLE {
  id: string
  community_id: string
  name: string
  role_authorithy"authority"NOTNULL: "AUTHORITY"
}
 
interface TABLE_COMMUNITY_MEMBER {
  id: string
  user_id: string
  community_id: string
  community_role_id: string
  created_at: string | Date
}
 
interface TABLE_COMMUNITY_POST {
  id: string
  community_id: string
  post_id: string
  community_member_id: string
}
 
interface DATABASE {
  user: TABLE_USER
  profile: TABLE_PROFILE
  post: TABLE_POST
  post_comment: TABLE_POST_COMMENT
  post_upvote: TABLE_POST_UPVOTE
  post_downvote: TABLE_POST_DOWNVOTE
  community: TABLE_COMMUNITY
  community_role: TABLE_COMMUNITY_ROLE
  community_member: TABLE_COMMUNITY_MEMBER
  community_post: TABLE_COMMUNITY_POST

}
 
 export default DATABASE