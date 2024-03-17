export interface user {
	id: string;
	username: string;
	password_hash: string;
	description: string;
	picture: string;
};

export interface post {
	id: string;
	author_id: string;
	title: string;
	content: string;
	created_at: Date;
	updated_at: Date;
	attachment_url: string;
};

export interface post_tag {
	id: string;
	post_id: string;
	name: string;
};

export interface post_comment {
	id: string;
	author_id: string;
	post_id: string;
	content: string;
	created_at: Date;
	updated_at: Date;
};

export interface post_upvote {
	id: string;
	user_id: string;
	post_id: string;
};

export interface post_downvote {
	id: string;
	user_id: string;
	post_id: string;
};

export interface community {
	id: string;
	name: string;
	description: string;
	member_count: number;
	created_at: Date;
	updated_at: Date;
};

export type authority =
	STRING |
	STRING |
	STRING |
	STRING 

export interface community_role {
	id: string;
	community_id: string;
	name: string;
	role_authority: authority;
};

export interface community_member {
	id: string;
	user_id: string;
	community_id: string;
	created_at: Date;
};

export interface community_member_role {
	id: string;
	community_member_id: string;
	community_role_id: string;
};

export interface community_post {
	id: string;
	community_id: string;
	post_id: string;
	community_member_id: string;
};

