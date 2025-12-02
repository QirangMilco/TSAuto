import type { SkillMechanicFunction, MechanicResult } from '../types/definitions';
import { BattleEventType } from '../types/definitions';

/**
 * 技能机制注册表
 * 负责管理和调用各种技能机制函数
 */
export class SkillMechanicRegistry {
    private static instance: SkillMechanicRegistry;
    private mechanicMap: Map<string, SkillMechanicFunction> = new Map();
    
    private constructor() {}
    
    /**
     * 获取单例实例
     */
    public static getInstance(): SkillMechanicRegistry {
        if (!SkillMechanicRegistry.instance) {
            SkillMechanicRegistry.instance = new SkillMechanicRegistry();
        }
        return SkillMechanicRegistry.instance;
    }
    
    /**
     * 注册技能机制
     * @param mechanicId 机制ID
     * @param mechanicFunction 机制函数
     */
    public registerMechanic(mechanicId: string, mechanicFunction: SkillMechanicFunction): void {
        this.mechanicMap.set(mechanicId, mechanicFunction);
    }
    
    /**
     * 获取技能机制
     * @param mechanicId 机制ID
     * @returns 机制函数，如果不存在则返回undefined
     */
    public getMechanic(mechanicId: string): SkillMechanicFunction | undefined {
        return this.mechanicMap.get(mechanicId);
    }
    
    /**
     * 执行技能机制
     * @param mechanicId 机制ID
     * @param context 机制上下文
     * @returns 机制执行结果
     * @throws {Error} 如果机制ID不存在
     */
    public executeMechanic(mechanicId: string, context: any): MechanicResult | undefined {
        const mechanicFunction = this.getMechanic(mechanicId);
        if (mechanicFunction) {
            try {
                return mechanicFunction(context);
            } catch (error) {
                console.error(`执行技能机制 ${mechanicId} 时出错:`, error);
                return undefined;
            }
        }
        console.warn(`未找到技能机制 ${mechanicId}`);
        return undefined;
    }
    
    /**
     * 批量注册机制
     * @param mechanics 机制映射对象
     */
    public registerMechanics(mechanics: Record<string, SkillMechanicFunction>): void {
        for (const [mechanicId, mechanicFunction] of Object.entries(mechanics)) {
            this.registerMechanic(mechanicId, mechanicFunction);
        }
    }
}

// 预设的技能机制函数
export const PRESET_SKILL_MECHANICS: Record<string, SkillMechanicFunction> = {
    // 示例：协战机制
    'MECH_ASSIST': (context) => {
        // 随机选择一个队友进行协战
        const teammates = [...context.battleState.players];
        if (teammates.length > 0) {
            const assistCharacter = teammates[Math.floor(Math.random() * teammates.length)];
            
            // 触发协战攻击
            return {
                assist: {
                    character: assistCharacter,
                    skillId: assistCharacter.skills[0] // 使用默认技能
                },
                message: `${context.caster.name}触发了${assistCharacter.name}的协战！`
            };
        }
        return {};
    },
    
    // 示例：多段伤害机制
    'MECH_MULTI_HIT': (context) => {
        // 造成多段伤害
        const hitCount = 3;
        return {
            multiHit: hitCount,
            message: `${context.caster.name}发动了${hitCount}段攻击！`
        };
    },
    
    // 示例：伤害反弹机制
    'MECH_DAMAGE_REFLECT': (context) => {
        // 反弹一部分伤害给攻击者
        if (context.eventType === BattleEventType.ON_DAMAGE_RECEIVED && context.damageResult) {
            const reflectDamage = context.damageResult.damage * 0.3;
            return {
                reflectDamage,
                message: `${context.caster.name}反弹了${reflectDamage}点伤害！`
            };
        }
        return {};
    },
    
    // 示例：生命偷取机制
    'MECH_LIFE_STEAL': (context) => {
        // 偷取伤害的一部分作为生命值
        if (context.damageResult) {
            const stealAmount = context.damageResult.damage * 0.2;
            return {
                lifeSteal: stealAmount,
                message: `${context.caster.name}偷取了${stealAmount}点生命值！`
            };
        }
        return {};
    },
    
    // 示例：状态扩散机制
    'MECH_STATUS_SPREAD': (context) => {
        // 将目标身上的状态扩散到其他敌人
        if (context.targets.length > 0) {
            const primaryTarget = context.targets[0];
            const spreadableStatuses = primaryTarget.statuses.filter((s: any) => s.remainingTurns > 0);
            
            if (spreadableStatuses.length > 0) {
                const statusToSpread = spreadableStatuses[Math.floor(Math.random() * spreadableStatuses.length)];
                return {
                    spreadStatus: statusToSpread,
                    message: `${context.caster.name}将${primaryTarget.name}身上的状态扩散到了其他敌人！`
                };
            }
        }
        return {};
    },
    
    // 示例：鬼火消耗机制
    'MECH_SPIRIT_FIRE_COST': (context) => {
        // 根据当前鬼火数量增加伤害
        const currentSpiritFire = context.battleState.resourceManager.currentResource;
        const damageBoost = currentSpiritFire * 0.1;
        return {
            damageMultiplier: 1 + damageBoost,
            message: `${context.caster.name}消耗了所有鬼火，伤害大幅提升！`
        };
    }
};

// 初始化默认机制
SkillMechanicRegistry.getInstance().registerMechanics(PRESET_SKILL_MECHANICS);
