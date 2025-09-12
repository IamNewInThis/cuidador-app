import supabase from "../lib/supabase";

class ConversationsService {
    async createMessage({ userId, babyId = null, content, role }) {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .insert([
                    {
                        user_id: userId,
                        baby_id: babyId,
                        content,
                        role,
                    }
                ])
                .select('*')
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating message:', error);
            throw error;
        }
    }

    async getConversationHistory(limit = 50) {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching conversation history:', error);
            throw error;
        }
    }

    async getConversationsByBaby(babyId, limit = 50) {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('baby_id', babyId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching baby conversations:', error);
            throw error;
        }
    }
}

export default new ConversationsService();
