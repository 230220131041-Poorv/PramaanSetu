// @ts-nocheck - Supabase type definitions incompatible with strict mode
import { supabase } from '@/lib/supabase';
import { 
  Skill, 
  SkillInsert, 
  SkillUpdate,
  Achievement,
  AchievementInsert,
  AchievementUpdate 
} from '@/types/database';

// =============================================
// SKILLS SERVICE
// =============================================

/**
 * Get all skills for a user
 */
export async function getSkills(userId: string): Promise<Skill[]> {
  try {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', userId)
      .order('proficiency', { ascending: false });

    if (error) {
      console.error('GetSkills error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('GetSkills error:', error);
    return [];
  }
}

/**
 * Add a new skill
 */
export async function addSkill(
  skill: Omit<SkillInsert, 'id' | 'created_at'>
): Promise<{ success: boolean; data?: Skill; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('skills')
      .insert(skill as any)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'You already have this skill' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Skill };
  } catch (error) {
    console.error('AddSkill error:', error);
    return { success: false, error: 'Failed to add skill' };
  }
}

/**
 * Update a skill
 */
export async function updateSkill(
  skillId: string,
  updates: Pick<SkillUpdate, 'name' | 'proficiency'>
): Promise<{ success: boolean; data?: Skill; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('skills')
      .update(updates as any)
      .eq('id', skillId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Skill };
  } catch (error) {
    console.error('UpdateSkill error:', error);
    return { success: false, error: 'Failed to update skill' };
  }
}

/**
 * Delete a skill
 */
export async function deleteSkill(
  skillId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', skillId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('DeleteSkill error:', error);
    return { success: false, error: 'Failed to delete skill' };
  }
}

// =============================================
// ACHIEVEMENTS SERVICE
// =============================================

/**
 * Get all achievements for a user
 */
export async function getAchievements(userId: string): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('date_earned', { ascending: false });

    if (error) {
      console.error('GetAchievements error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('GetAchievements error:', error);
    return [];
  }
}

/**
 * Add a new achievement
 */
export async function addAchievement(
  achievement: Omit<AchievementInsert, 'id' | 'created_at'>
): Promise<{ success: boolean; data?: Achievement; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .insert(achievement as any)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Achievement };
  } catch (error) {
    console.error('AddAchievement error:', error);
    return { success: false, error: 'Failed to add achievement' };
  }
}

/**
 * Update an achievement
 */
export async function updateAchievement(
  achievementId: string,
  updates: Pick<AchievementUpdate, 'title' | 'description' | 'date_earned' | 'icon'>
): Promise<{ success: boolean; data?: Achievement; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .update(updates as any)
      .eq('id', achievementId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Achievement };
  } catch (error) {
    console.error('UpdateAchievement error:', error);
    return { success: false, error: 'Failed to update achievement' };
  }
}

/**
 * Delete an achievement
 */
export async function deleteAchievement(
  achievementId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('achievements')
      .delete()
      .eq('id', achievementId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('DeleteAchievement error:', error);
    return { success: false, error: 'Failed to delete achievement' };
  }
}
