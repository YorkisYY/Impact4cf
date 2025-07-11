type HandleFunction = (i: string, s: string) => Promise<void>;

export type UserProfile = {
  uid: string;
  email: string;
  role: string;
  name?: string;
};

export type Profile = {
  id: string;
  avatar: string;
  name: string;
  time: string;
};

export type PostImage = {
  img: string;
  featured?: boolean;
  title?: string;
};

type Likes = {
  like: boolean;
  value: number;
};


export type Reply = {
  id: string;
  profile: Profile;
  data: CommentData;
};

export type CommentData = {
  name?: string;
  comment?: string;
  likes?: Likes;
  video?: string;
  replies?: Reply[];
};

type PostData = {
  id?: string;
  content: string;
  images: PostImage[];
  video?: string;
  likes: Likes;
  comments?: Comment[];
};
export type Comment = {
  id: string;
  profile: Profile;
  data?: CommentData;
};

export type PostDataType = { id: string; data: PostData; profile: Profile };

export interface PostProps {
  commentAdd: (s: string, c: Reply) => Promise<void>;
  handleCommentLikes: HandleFunction;
  editPost?: HandleFunction;
  renderPost?: HandleFunction;
  setPosts?: React.Dispatch<React.SetStateAction<PostDataType[]>>;
  handlePostLikes: (s: string) => Promise<void>;
  handleReplayLikes: (postId: string, commentId: string, replayId: string) => Promise<void>;
  post: PostDataType;
  replyAdd: (postId: string, commentId: string, reply: Reply) => Promise<void>;

}