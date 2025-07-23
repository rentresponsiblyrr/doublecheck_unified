/**
 * User Statistics Service - Enterprise Grade
 *
 * Handles user statistics calculation and analysis
 */

import { User, UserStats } from "../types";

export class UserStatisticsService {
  /**
   * Calculate comprehensive user statistics
   */
  calculateStats(users: User[]): UserStats {
    const stats: UserStats = {
      total: users.length,
      active: 0,
      inactive: 0,
      byRole: {},
      recentSignIns: 0,
    };

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    users.forEach((user) => {
      // Active/inactive status
      if (user.status === "active") {
        stats.active++;
      } else {
        stats.inactive++;
      }

      // By role
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;

      // Recent sign-ins
      if (user.last_login_at && new Date(user.last_login_at) >= oneWeekAgo) {
        stats.recentSignIns++;
      }
    });

    return stats;
  }

  /**
   * Calculate user activity trends
   */
  calculateActivityTrends(users: User[]): {
    dailyActivity: number[];
    weeklyGrowth: number;
    monthlyRetention: number;
  } {
    // Mock implementation - would calculate from actual data
    return {
      dailyActivity: Array.from({ length: 7 }, () =>
        Math.floor(Math.random() * users.length),
      ),
      weeklyGrowth: Math.random() * 20 - 5, // -5% to +15%
      monthlyRetention: 75 + Math.random() * 20, // 75% to 95%
    };
  }

  /**
   * Get role distribution as percentages
   */
  getRoleDistribution(users: User[]): { role: string; percentage: number }[] {
    const stats = this.calculateStats(users);
    const total = stats.total;

    if (total === 0) return [];

    return Object.entries(stats.byRole).map(([role, count]) => ({
      role,
      percentage: Math.round((count / total) * 100),
    }));
  }
}
