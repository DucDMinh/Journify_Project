import { BaseRepository, unwrap } from './repo.js';
import { supabase } from '../config/supabaseClient.js';

class BlogRepository extends BaseRepository {
    constructor() {
        super('blogs');
    }

    async getAll(currentUserId = null) {
        const blogs = unwrap(
            await this.table()
                .select('*, user_id(id, name, avatar)')
                .order('created_at', { ascending: false }),
        );
        if (!currentUserId || blogs.length === 0) {
            return blogs.map((blog) => ({ ...blog, is_liked: false }));
        }

        const userLikes = unwrap(
            await supabase
                .from('blog_likes')
                .select('blog_id')
                .eq('user_id', currentUserId)
                .in('blog_id', blogs.map((b) => b.id)),
        );
        const likedIds = new Set(userLikes.map((like) => like.blog_id));
        return blogs.map((blog) => ({ ...blog, is_liked: likedIds.has(blog.id) }));
    }

    async getComments(blogId) {
        return unwrap(
            await supabase
                .from('blog_comments')
                .select('id, content, created_at, blog_id, user_id(id, name, avatar)')
                .eq('blog_id', blogId)
                .order('created_at', { ascending: true }),
        );
    }

    async addComment({ blogId, userId, content }) {
        const comment = unwrap(
            await supabase
                .from('blog_comments')
                .insert({ blog_id: blogId, user_id: userId, content })
                .select('id, content, created_at, blog_id, user_id(id, name, avatar)')
                .single(),
        );
        await this.syncCommentCount(blogId);
        return comment;
    }

    async getComment(commentId) {
        return unwrap(await supabase.from('blog_comments').select('id, blog_id, user_id').eq('id', commentId).maybeSingle());
    }

    async deleteComment(commentId, blogId) {
        unwrap(await supabase.from('blog_comments').delete().eq('id', commentId));
        await this.syncCommentCount(blogId);
    }

    async syncCommentCount(blogId) {
        const { count, error } = await supabase.from('blog_comments').select('*', { count: 'exact', head: true }).eq('blog_id', blogId);
        if (error) throw error;
        unwrap(await this.table().update({ comments: count ?? 0 }).eq('id', blogId));
        return count ?? 0;
    }

    async like(blogId, userId) {
        unwrap(await supabase.rpc('like_blog', { p_blog_id: blogId, p_user_id: userId }));
    }

    async unlike(blogId, userId) {
        unwrap(await supabase.rpc('unlike_blog', { p_blog_id: blogId, p_user_id: userId }));
    }
}

export const blogRepo = new BlogRepository();
