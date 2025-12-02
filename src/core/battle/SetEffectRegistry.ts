import type { SetEffectFunction } from '../types/definitions';

/**
 * 套装效果注册表
 * 负责管理和调用各种套装效果函数
 */
export class SetEffectRegistry {
    private static instance: SetEffectRegistry;
    private effectMap: Map<string, SetEffectFunction> = new Map();
    
    private constructor() {}
    
    /**
     * 获取单例实例
     */
    public static getInstance(): SetEffectRegistry {
        if (!SetEffectRegistry.instance) {
            SetEffectRegistry.instance = new SetEffectRegistry();
        }
        return SetEffectRegistry.instance;
    }
    
    /**
     * 注册套装效果
     * @param effectId 效果ID
     * @param effectFunction 效果函数
     */
    public registerEffect(effectId: string, effectFunction: SetEffectFunction): void {
        this.effectMap.set(effectId, effectFunction);
    }
    
    /**
     * 获取套装效果
     * @param effectId 效果ID
     * @returns 效果函数，如果不存在则返回undefined
     */
    public getEffect(effectId: string): SetEffectFunction | undefined {
        return this.effectMap.get(effectId);
    }
    
    /**
     * 执行套装效果
     * @param effectId 效果ID
     * @param context 效果上下文
     * @returns 效果执行结果
     */
    public executeEffect(effectId: string, context: any): any {
        const effectFunction = this.getEffect(effectId);
        if (effectFunction) {
            return effectFunction(context);
        }
        return undefined;
    }
    
    /**
     * 批量注册效果
     * @param effects 效果映射对象
     */
    public registerEffects(effects: Record<string, SetEffectFunction>): void {
        for (const [effectId, effectFunction] of Object.entries(effects)) {
            this.registerEffect(effectId, effectFunction);
        }
    }
}

// 预设的套装效果函数
export const PRESET_SET_EFFECTS: Record<string, SetEffectFunction> = {
    // 破势：对生命>70%造成额外40%伤害
    'EFF_POSHI': (context) => {
        if (context.eventType === 'ON_DAMAGE_DEALT' && context.target) {
            const hpRatio = context.target.currentHp / context.target.maxHp;
            if (hpRatio > 0.7) {
                // 增加40%伤害
                return {
                    damageMultiplier: 1.4,
                    message: `${context.character.name}触发了破势效果，对生命值高于70%的目标造成额外伤害！`
                };
            }
        }
        return {};
    },
    
    // 针女：暴击时有40%概率造成目标最大生命值10%的无视防御伤害
    'EFF_ZHENNV': (context) => {
        if (context.eventType === 'ON_DAMAGE_DEALT' && context.target) {
            // 假设暴击信息存在于上下文中
            if (context.isCrit) {
                // 40%概率触发
                if (Math.random() < 0.4) {
                    const extraDamage = context.target.maxHp * 0.1;
                    return {
                        extraDamage: extraDamage,
                        ignoreDefense: true,
                        message: `${context.character.name}触发了针女效果，对目标造成了额外伤害！`
                    };
                }
            }
        }
        return {};
    },
    
    // 狂骨：根据当前鬼火增加伤害
    'EFF_KUANGGU': (context) => {
        if (context.eventType === 'ON_DAMAGE_DEALT') {
            const currentResource = context.battleState.resourceManager.currentResource;
            // 每点鬼火增加8%伤害，最多40%
            const damageBoost = Math.min(currentResource * 8, 40) / 100;
            return {
                damageMultiplier: 1 + damageBoost,
                message: `${context.character.name}触发了狂骨效果，根据当前鬼火增加了伤害！`
            };
        }
        return {};
    },
    
    // 心眼：目标生命值低时增加伤害
    'EFF_XINYAN': (context) => {
        if (context.eventType === 'ON_DAMAGE_DEALT' && context.target) {
            const hpRatio = context.target.currentHp / context.target.maxHp;
            let damageBoost = 0;
            
            if (hpRatio <= 0.3) {
                damageBoost = 0.3; // 30%额外伤害
            } else if (hpRatio <= 0.5) {
                damageBoost = 0.2; // 20%额外伤害
            } else if (hpRatio <= 0.7) {
                damageBoost = 0.1; // 10%额外伤害
            }
            
            if (damageBoost > 0) {
                return {
                    damageMultiplier: 1 + damageBoost,
                    message: `${context.character.name}触发了心眼效果，对低生命值目标造成额外伤害！`
                };
            }
        }
        return {};
    },
    
    // 终极增益：7件套效果示例
    'EFF_ULTIMATE': (context) => {
        if (context.eventType === 'ON_TURN_START') {
            // 为角色增加各种增益效果
            return {
                statBoosts: {
                    ATK_P: 20,
                    CRIT: 10,
                    CRIT_DMG: 20
                },
                message: `${context.character.name}获得了终极增益效果！`
            };
        }
        return {};
    }
};

// 初始化默认效果
SetEffectRegistry.getInstance().registerEffects(PRESET_SET_EFFECTS);
