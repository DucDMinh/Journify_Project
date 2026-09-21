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

    async like(blogId, userId) {
        unwrap(await supabase.rpc('like_blog', { p_blog_id: blogId, p_user_id: userId }));
    }

    async unlike(blogId, userId) {
        unwrap(await supabase.rpc('unlike_blog', { p_blog_id: blogId, p_user_id: userId }));
    }
}

export const blogRepo = new BlogRepository();
