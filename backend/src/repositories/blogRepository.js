import { BaseRepository } from './repo.js'
import { supabase } from '../config/supabaseClient.js'

class BlogRepository extends BaseRepository {
    constructor() {
        super('blogs')
    }
    getAll = async (currentUserId = null) => {
        const { data: blogs, error } = await supabase
            .from('blogs')
            .select('*, user_id(id, name, avatar)')
            .order('created_at', { ascending: false });
        if (error || !blogs) return { data: null, error };
        if (!currentUserId) {
            const dataForGuest = blogs.map(blog => ({ ...blog, is_liked: false }));
            return { data: dataForGuest, error: null };
        }
        const blogIds = blogs.map(b => b.id);
        const { data: userLikes, error: likesError } = await supabase
            .from('blog_likes')
            .select('blog_id')
            .eq('user_id', currentUserId)
            .in('blog_id', blogIds);

        if (likesError) return { data: null, error: likesError };
        const likedBlogIds = new Set(userLikes.map(like => like.blog_id));
        const finalData = blogs.map(blog => ({
            ...blog,
            is_liked: likedBlogIds.has(blog.id)
        }));

        return { data: finalData, error: null };
    }
    likeBlog = async (payload) => {
        const { data, error } = await supabase.rpc('like_blog', payload)
        if (error) throw new Error(error.message);
    }
    unlikeBlog = async (blog_id, user_id) => {
        const { data, error } = await supabase.rpc('unlike_blog', {
            p_blog_id: blog_id,
            p_user_id: user_id
        });
        if (error) {
            console.error("Lỗi khi bỏ Like:", error);
        }
    }
}

export const blogRepo = new BlogRepository();