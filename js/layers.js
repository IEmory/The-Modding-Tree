function scaleStaticCost(gain, row) {
	if (gain.gte(1225)) gain = gain.pow(10).div(Decimal.pow(1225, 9));
	if (gain.gte(12) && row<4) gain = gain.pow(2).div(12);
	return gain;
}

function softcapStaticGain(gain, row) {
	if (gain.gte(12) && row<4) gain = gain.times(12).sqrt();
	if (gain.gte(1225)) gain = gain.times(Decimal.pow(1225, 9)).root(10);
	return gain;
}

addLayer("p", {
        name: "prestige", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "P", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#31aeb0",
        requires: new Decimal(10), // Can be a function that takes requirement increases into account
        resource: "prestige points", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: 0.5, // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (hasAchievement("a", 13)) mult = mult.times(1.1);
			if (hasAchievement("a", 32)) mult = mult.times(2);
			if (hasUpgrade("p", 21)) mult = mult.times(1.8);
			if (hasUpgrade("b", 11)) mult = mult.times(upgradeEffect("b", 11));
			if (hasUpgrade("g", 11)) mult = mult.times(upgradeEffect("g", 11));
			if (player.t.unlocked) mult = mult.times(tmp.t.enEff);
			if (player.e.unlocked) mult = mult.times(layers.e.buyables[11].effect().first);
			if (player.s.unlocked) mult = mult.times(buyableEffect("s", 11));
			if (hasUpgrade("e", 12)) mult = mult.times(upgradeEffect("e", 12));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            let exp = new Decimal(1)
			if (hasUpgrade("p", 31)) exp = exp.times(1.05);
			return exp;
        },
        row: 0, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "p", description: "Press P to Prestige.", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        layerShown(){return true},
		update(diff) {
			if (hasMilestone("g", 1)) generatePoints("p", diff);
		},
		doReset(resettingLayer) {
			let keep = [];
			if (hasMilestone("b", 0) && resettingLayer=="b") keep.push("upgrades")
			if (hasMilestone("g", 0) && resettingLayer=="g") keep.push("upgrades")
			if (hasMilestone("e", 1) && resettingLayer=="e") keep.push("upgrades")
			if (hasMilestone("t", 1) && resettingLayer=="t") keep.push("upgrades")
			if (hasMilestone("s", 1) && resettingLayer=="s") keep.push("upgrades")
			if (layers[resettingLayer].row > this.row) layerDataReset("p", keep)
		},
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			first: 0,
		}},
		prestigeBoostSS() {
			return new Decimal(1);
		},
		upgrades: {
			rows: 3,
			cols: 3,
			11: {
				title: "Begin",
				description: "Generate 1 Point every second.",
				cost: new Decimal(1),
			},
			12: {
				title: "Prestige Boost",
				description: "Prestige Points boost Point generation.",
				cost: new Decimal(1),
				effect() {
					let eff = player.p.points.plus(2).pow(0.5);
					if (hasUpgrade("g", 14)) eff = eff.pow(1.5);
					if (hasUpgrade("g", 24)) eff = eff.pow(1.4666667);
					let ssPow = tmp.p.prestigeBoostSS
					if (eff.gte(Decimal.pow("1e20000000", ssPow))) eff = eff.sqrt().times(Decimal.pow("1e10000000", ssPow))
					if (eff.gte(Decimal.pow("1e75000000", ssPow))) eff = eff.log10().pow(8e6).times(Decimal.div(Decimal.pow("1e75000000", ssPow), Decimal.pow(Decimal.mul(75e6, ssPow), 8e6))).min(eff)
					return eff;
				},
				unlocked() { return hasUpgrade("p", 11) },
				effectDisplay() { return format(this.effect())+"x" },
			},
			13: {
				title: "Self-Synergy",
				description: "Points boost their own generation.",
				cost: new Decimal(5),
				effect() { 
					let eff = player.points.plus(1).log10().pow(0.75).plus(1);
					if (hasUpgrade("p", 33)) eff = eff.pow(upgradeEffect("p", 33));
					if (hasUpgrade("g", 15)) eff = eff.pow(upgradeEffect("g", 15));
					return eff;
				},
				unlocked() { return hasUpgrade("p", 12) },
				effectDisplay() { return format(this.effect())+"x" },
			},
			21: {
				title: "More Prestige",
				description: "Prestige Point gain is increased by 80%.",
				cost: new Decimal(20),
				unlocked() { return hasAchievement("a", 21)&&hasUpgrade("p", 11) },
			},
			22: {
				title: "Upgrade Power",
				description: "Point generation is faster based on your Prestige Upgrades bought.",
				cost: new Decimal(75),
				effect() {
					let eff = Decimal.pow(1.4, player.p.upgrades.length);
					if (hasUpgrade("p", 32)) eff = eff.pow(2);
					return eff;
				},
				unlocked() { return hasAchievement("a", 21)&&hasUpgrade("p", 12) },
				effectDisplay() { return format(this.effect())+"x" },
			},
			23: {
				title: "Reverse Prestige Boost",
				description: "Prestige Point gain is boosted by your Points.",
				cost: new Decimal(5e3),
				effect() {
					let eff = player.points.plus(1).log10().cbrt().plus(1);
					if (hasUpgrade("p", 33)) eff = eff.pow(upgradeEffect("p", 33));
					if (hasUpgrade("g", 23)) eff = eff.pow(upgradeEffect("g", 23));
					return eff;
				},
				unlocked() { return hasAchievement("a", 21)&&hasUpgrade("p", 13) },
				effectDisplay() { return format(this.effect())+"x" },
			},
			31: {
				title: "WE NEED MORE PRESTIGE",
				description: "Prestige Point gain is raised to the power of 1.05.",
				cost: new Decimal(1e45),
				unlocked() { return hasAchievement("a", 23)&&hasUpgrade("p", 21) },
			},
			32: {
				title: "Still Useless",
				description: "<b>Upgrade Power</b> is squared.",
				cost: new Decimal(1e56),
				unlocked() { return hasAchievement("a", 23)&&hasUpgrade("p", 22) },
			},
			33: {
				title: "Column Leader",
				description: "Both above upgrades are stronger based on your Total Prestige Points.",
				cost: new Decimal(1e60),
				effect() { return player.p.total.plus(1).log10().plus(1).log10().div(5).plus(1) },
				unlocked() { return hasAchievement("a", 23)&&hasUpgrade("p", 23) },
				effectDisplay() { return "^"+format(this.effect()) },
			},
		},
})

addLayer("b", {
        name: "boosters", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "B", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#6e64c4",
        requires() { return new Decimal(200).times((player.b.unlockOrder&&!player.b.unlocked)?5000:1) }, // Can be a function that takes requirement increases into account
        resource: "boosters", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		branches: ["p"],
        exponent: 1.25, // Prestige currency exponent
		base: 5,
		gainMult() { 
			let mult = new Decimal(1);
			if (hasUpgrade("b", 23)) mult = mult.div(upgradeEffect("b", 23));
			if (player.s.unlocked) mult = mult.div(buyableEffect("s", 13));
			return mult;
		},
		canBuyMax() { return hasMilestone("b", 1) },
        row: 1, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "b", description: "Press B to perform a booster reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        layerShown(){return player.p.unlocked},
		automate() {},
		resetsNothing() { return hasMilestone("t", 4) },
		effectBase() {
			let base = new Decimal(2);
			if (hasUpgrade("b", 12)) base = base.plus(upgradeEffect("b", 12));
			if (hasUpgrade("b", 13)) base = base.plus(upgradeEffect("b", 13));
			if (hasUpgrade("t", 11)) base = base.plus(upgradeEffect("t", 11));
			if (hasUpgrade("e", 11)) base = base.plus(upgradeEffect("e", 11).b);
			if (player.e.unlocked) base = base.plus(layers.e.buyables[11].effect().second);
			if (player.s.unlocked) base = base.plus(buyableEffect("s", 12));
			return base;
		},
		effect() {
			return Decimal.pow(this.effectBase(), player.b.points).max(0);
		},
		effectDescription() {
			return "which are boosting Point generation by "+format(this.effect())+"x"
		},
		doReset(resettingLayer) {
			let keep = [];
			if (hasMilestone("e", 0) && resettingLayer=="e") keep.push("milestones")
			if (hasMilestone("t", 0) && resettingLayer=="t") keep.push("milestones")
			if (hasMilestone("s", 0) && resettingLayer=="s") keep.push("milestones")
			if (hasMilestone("t", 2)) keep.push("upgrades")
			if (hasMilestone("e", 2) && resettingLayer=="e") keep.push("upgrades")
			if (layers[resettingLayer].row > this.row) layerDataReset("b", keep)
		},
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			first: 0,
			auto: false,
		}},
		automate() {
			if (hasMilestone("t", 3) && player.b.auto) doReset("b");
		},
		increaseUnlockOrder: ["g"],
		milestones: {
			0: {
				requirementDescription: "8 Boosters",
				done() { return player.b.best.gte(8) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			1: {
				requirementDescription: "15 Boosters",
				done() { return player.b.best.gte(15) },
				effectDescription: "You can buy max Boosters.",
			},
		},
		upgrades: {
			rows: 2,
			cols: 3,
			11: {
				title: "BP Combo",
				description: "Best Boosters boost Prestige Point gain.",
				cost: new Decimal(3),
				effect() { 
					let ret = player.b.best.sqrt().plus(1);
					if (hasUpgrade("s", 15)) ret = ret.pow(buyableEffect("s", 14).root(2.7));
					return ret;
				},
				unlocked() { return player.b.unlocked },
				effectDisplay() { return format(this.effect())+"x" },
			},
			12: {
				title: "Cross-Contamination",
				description: "Generators add to the Booster effect base.",
				cost: new Decimal(7),
				effect() { return player.g.points.add(1).log10().sqrt().div(3) },
				unlocked() { return player.b.unlocked&&player.g.unlocked },
				effectDisplay() { return "+"+format(this.effect()) },
			},
			13: {
				title: "PB Reversal",
				description: "Total Prestige Points add to the Booster effect base.",
				cost: new Decimal(8),
				effect() { return player.p.total.add(1).log10().add(1).log10().div(3) },
				unlocked() { return player.b.unlocked&&player.b.best.gte(7) },
				effectDisplay() { return "+"+format(this.effect()) },
			},
			21: {
				title: "Gen Z^2",
				description: "Square the Generator Power effect.",
				cost: new Decimal(9),
				unlocked() { return hasUpgrade("b", 11) && hasUpgrade("b", 12) },
			},
			22: {
				title: "Up to the Fifth Floor",
				description: "Raise the Generator Power effect ^1.2.",
				cost: new Decimal(15),
				unlocked() { return hasUpgrade("b", 12) && hasUpgrade("b", 13) },
			},
			23: {
				title: "Discount One",
				description: "Boosters are cheaper based on your Points.",
				cost: new Decimal(18),
				effect() { 
					let ret = player.points.add(1).log10().add(1).pow(3.2);
					if (player.s.unlocked) ret = ret.pow(buyableEffect("s", 14));
					return ret;
				},
				unlocked() { return hasUpgrade("b", 21) || hasUpgrade("b", 22) },
				effectDisplay() { return "/"+format(this.effect()) },
			},
		},
})

addLayer("g", {
        name: "generators", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "G", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#a3d9a5",
        requires() { return new Decimal(200).times((player.g.unlockOrder&&!player.g.unlocked)?5000:1) }, // Can be a function that takes requirement increases into account
        resource: "generators", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		branches: ["p"],
        exponent: 1.25, // Prestige currency exponent
		base: 5,
		gainMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("g", 22)) mult = mult.div(upgradeEffect("g", 22));
			if (player.s.unlocked) mult = mult.div(buyableEffect("s", 13));
			return mult;
		},
		canBuyMax() { return hasMilestone("g", 2) },
        row: 1, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "g", description: "Press G to perform a generator reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        layerShown(){return player.p.unlocked},
		automate() {},
		resetsNothing() { return hasMilestone("s", 4) },
		effBase() {
			let base = new Decimal(2);
			if (hasUpgrade("g", 12)) base = base.plus(upgradeEffect("g", 12));
			if (hasUpgrade("g", 13)) base = base.plus(upgradeEffect("g", 13));
			if (hasUpgrade("e", 11)) base = base.plus(upgradeEffect("e", 11).g);
			if (player.e.unlocked) base = base.plus(layers.e.buyables[11].effect().second);
			if (player.s.unlocked) base = base.plus(buyableEffect("s", 12));
			return base;
		},
		effect() {
			let eff = Decimal.pow(this.effBase(), player.g.points).sub(1).max(0);
			if (hasUpgrade("g", 21)) eff = eff.times(upgradeEffect("g", 21));
			if (hasUpgrade("g", 25)) eff = eff.times(upgradeEffect("g", 25));
			if (hasUpgrade("t", 15)) eff = eff.times(tmp.t.enEff);
			if (hasUpgrade("s", 12)) eff = eff.times(upgradeEffect("s", 12));
			if (hasUpgrade("s", 13)) eff = eff.times(upgradeEffect("s", 13));
			return eff;
		},
		effectDescription() {
			return "which are generating "+format(this.effect())+" Generator Power/sec"
		},
		update(diff) {
			if (player.g.unlocked) player.g.power = player.g.power.plus(tmp.g.effect.times(diff));
		},
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			power: new Decimal(0),
			first: 0,
			auto: false,
		}},
		automate() {
			if (hasMilestone("s", 3) && player.g.auto) doReset("g");
		},
		powerExp() {
			let exp = new Decimal(1/3);
			if (hasUpgrade("b", 21)) exp = exp.times(2);
			if (hasUpgrade("b", 22)) exp = exp.times(1.2);
			return exp;
		},
		powerEff() {
			return player.g.power.plus(1).pow(this.powerExp());
		},
		doReset(resettingLayer) {
			let keep = [];
			player.g.power = new Decimal(0);
			if (hasMilestone("e", 0) && resettingLayer=="e") keep.push("milestones")
			if (hasMilestone("t", 0) && resettingLayer=="t") keep.push("milestones")
			if (hasMilestone("s", 0) && resettingLayer=="s") keep.push("milestones")
			if (hasMilestone("s", 2)) keep.push("upgrades")
			if (hasMilestone("e", 2) && resettingLayer=="e") keep.push("upgrades")
			if (layers[resettingLayer].row > this.row) layerDataReset("g", keep)
		},
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'You have ' + format(player.g.power) + ' Generator Power, which boosts Point generation by '+format(tmp.g.powerEff)+'x'},
					{}],
			"blank",
			["display-text",
				function() {return 'Your best Generators is ' + formatWhole(player.g.best) + '<br>You have made a total of '+formatWhole(player.g.total)+" Generators."},
					{}],
			"blank",
			"milestones", "blank", "blank", "upgrades"],
		increaseUnlockOrder: ["b"],
		milestones: {
			0: {
				requirementDescription: "8 Generators",
				done() { return player.g.best.gte(8) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			1: {
				requirementDescription: "10 Generators",
				done() { return player.g.best.gte(10) },
				effectDescription: "You gain 100% of Prestige Point gain every second.",
			},
			2: {
				requirementDescription: "15 Generators",
				done() { return player.g.best.gte(15) },
				effectDescription: "You can buy max Generators.",
			},
		},
		upgrades: {
			rows: 2,
			cols: 5,
			11: {
				title: "GP Combo",
				description: "Best Generators boost Prestige Point gain.",
				cost: new Decimal(3),
				effect() { return player.g.best.sqrt().plus(1) },
				unlocked() { return player.g.unlocked },
				effectDisplay() { return format(this.effect())+"x" },
			},
			12: {
				title: "I Need More!",
				description: "Boosters add to the Generator base.",
				cost: new Decimal(7),
				effect() { return player.b.points.add(1).log10().sqrt().div(3) },
				unlocked() { return player.b.unlocked&&player.g.unlocked },
				effectDisplay() { return "+"+format(this.effect()) },
			},
			13: {
				title: "I Need More II",
				description: "Best Prestige Points add to the Generator base.",
				cost: new Decimal(8),
				effect() { return player.p.best.add(1).log10().add(1).log10().div(3) },
				unlocked() { return player.g.best.gte(8) },
				effectDisplay() { return "+"+format(this.effect()) },
			},
			14: {
				title: "Boost the Boost",
				description: "<b>Prestige Boost</b> uses a better formula.",
				cost: new Decimal(13),
				unlocked() { return player.g.best.gte(10) },
			},
			15: {
				title: "Outer Synergy",
				description: "<b>Self-Synergy</b> is stronger based on your Generators.",
				cost: new Decimal(15),
				effect() { 
					let eff = player.g.points.sqrt().add(1);
					if (eff.gte(400)) eff = eff.cbrt().times(Math.pow(400, 2/3))
					return eff;
				},
				unlocked() { return hasUpgrade("g", 13) },
				effectDisplay() { return "^"+format(this.effect()) },
			},
			21: {
				title: "I Need More III",
				description: "Generator Power boost its own generation.",
				cost: new Decimal(1e10),
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { return player.g.power.add(1).log10().add(1) },
				unlocked() { return hasUpgrade("g", 15) },
				effectDisplay() { return format(this.effect())+"x" },
			},
			22: {
				title: "Discount Two",
				description: "Generators are cheaper based on your Prestige Points.",
				cost: new Decimal(1e11),
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { return player.p.points.add(1).pow(0.25) },
				unlocked() { return hasUpgrade("g", 15) },
				effectDisplay() { return "/"+format(this.effect()) },
			},
			23: {
				title: "Double Reversal",
				description: "<b>Reverse Prestige Boost</b> is stronger based on your Boosters.",
				cost: new Decimal(1e12),
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { return player.b.points.pow(0.85).add(1) },
				unlocked() { return hasUpgrade("g", 15)&&player.b.unlocked },
				effectDisplay() { return "^"+format(this.effect()) },
			},
			24: {
				title: "Boost the Boost Again",
				description: "<b>Prestige Boost</b> uses an even better formula.",
				cost: new Decimal(20),
				unlocked() { return hasUpgrade("g", 14)&&(hasUpgrade("g", 21)||hasUpgrade("g", 22)) },
			},
			25: {
				title: "I Need More IV",
				description: "Prestige Points boost Generator Power gain.",
				cost: new Decimal(1e14),
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { return player.p.points.add(1).log10().pow(3).add(1) },
				unlocked() { return hasUpgrade("g", 23)&&hasUpgrade("g", 24) },
				effectDisplay() { return format(this.effect())+"x" },
			},
		},
})

addLayer("t", {
        name: "time", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "T", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			energy: new Decimal(0),
			first: 0,
        }},
        color: "#006609",
        requires() { return new Decimal(1e120).times(Decimal.pow("1e180", Decimal.pow(player[this.layer].unlockOrder, 2))) }, // Can be a function that takes requirement increases into account
        resource: "time capsules", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(1.85), // Prestige currency exponent
		base: new Decimal(1e15),
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		enCapMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("t", 12)) mult = mult.times(upgradeEffect("t", 12));
			return mult;
		},
		effect() { return {
			gain: Decimal.pow(3, player.t.points.plus(player.t.buyables[11]).plus(tmp.t.freeExtraTimeCapsules)).sub(1).times(player.t.points.plus(player.t.buyables[11]).gt(0)?1:0),
			limit: Decimal.pow(2, player.t.points.plus(player.t.buyables[11]).plus(tmp.t.freeExtraTimeCapsules)).sub(1).times(100).times(player.t.points.plus(player.t.buyables[11]).gt(0)?1:0).times(tmp.t.enCapMult),
		}},
		effectDescription() {
			return "which are generating "+format(this.effect().gain)+" Time Energy/sec, but with a limit of "+format(this.effect().limit)+" Time Energy"
		},
		enEff() {
			let eff = player.t.energy.add(1).pow(1.2);
			if (hasUpgrade("t", 14)) eff = eff.pow(1.3);
			return eff;
		},
		update(diff) {
			if (player.t.unlocked) player.t.energy = player.t.energy.plus(this.effect().gain.times(diff)).min(this.effect().limit);
		},
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "t", description: "Press T to Time Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'You have ' + format(player.t.energy) + ' Time Energy, which boosts Point & Prestige Point gain by '+format(tmp.t.enEff)+'x'},
					{}],
			"blank",
			["display-text",
				function() {return 'Your best Time Capsules is ' + formatWhole(player.t.best)},
					{}],
			"blank",
			"milestones", "blank", "buyables", "blank", "upgrades"],
        increaseUnlockOrder: ["e", "s"],
        doReset(resettingLayer){ // Triggers when this layer is being reset, along with the layer doing the resetting. Not triggered by lower layers resetting, but is by layers on the same row.
            // TODO
        },
        layerShown(){return player.b.unlocked},
        branches: ["b"],
		upgrades: {
			rows: 1,
			cols: 5,
			11: {
				title: "Pseudo-Boost",
				description: "Non-extra Time Capsules add to the Booster base.",
				cost: new Decimal(2),
				unlocked() { return player.t.unlocked },
				effect() { 
					return player.t.points.pow(0.9).add(0.5).plus(hasUpgrade("t", 13)?upgradeEffect("t", 13):0);
				},
				effectDisplay() { return "+"+format(this.effect()) },
			},
			12: {
				title: "Limit Stretcher",
				description: "The Time Energy cap starts later based on your Boosters, and you get a free Extra Time Capsule.",
				cost: new Decimal(5e4),
				currencyDisplayName: "time energy",
                currencyInternalName: "energy",
                currencyLayer: "t",
				unlocked() { return player.t.best.gte(2) },
				effect() { 
					return player.b.points.pow(0.95).add(1)
				},
				effectDisplay() { return format(this.effect())+"x" },
			},
			13: {
				title: "Pseudo-Pseudo-Boost",
				description: "Extra Time Capsules add to the first Time Upgrade's effect.",
				cost: new Decimal(3e6),
				currencyDisplayName: "time energy",
                currencyInternalName: "energy",
                currencyLayer: "t",
				unlocked() { return hasUpgrade("t", 12) },
				effect() { 
					return player.t.buyables[11].add(tmp.t.freeExtraTimeCapsules).pow(0.95);
				},
				effectDisplay() { return "+"+format(this.effect()) },
			},
			14: {
				title: "More Time",
				description: "The Time Energy effect is raised to the power of 1.3.",
				cost: new Decimal(4),
				unlocked() { return hasUpgrade("t", 13) },
			},
			15: {
				title: "Time Potency",
				description: "Time Energy affects Generator Power gain.",
				cost: new Decimal(1.25e7),
				currencyDisplayName: "time energy",
                currencyInternalName: "energy",
                currencyLayer: "t",
				unlocked() { return hasUpgrade("t", 13) },
			},
		},
		freeExtraTimeCapsules() {
			let free = new Decimal(0);
			if (hasUpgrade("t", 12)) free = free.plus(1);
			return free;
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Extra Time Capsules",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    if (x.gte(25)) x = x.pow(2).div(25)
                    let cost = x.times(0.4).pow(1.2).add(1).times(10)
                    return cost.floor()
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
					let e = tmp.t.freeExtraTimeCapsules;
                    return ("Cost: " + formatWhole(data.cost) + " Boosters\n\
                    Amount: " + formatWhole(player[this.layer].buyables[this.id])+(e.gt(0)?(" + "+formatWhole(e)):""))
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.b.points.gte(tmp[this.layer].buyables[this.id].cost)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.b.points = player.b.points.sub(cost)	
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'222px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Time Capsules",
				done() { return player.t.best.gte(2) },
				effectDescription: "Keep Booster/Generator milestones on reset.",
			},
			1: {
				requirementDescription: "3 Time Capsules",
				done() { return player.t.best.gte(3) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			2: {
				requirementDescription: "4 Time Capsules",
				done() { return player.t.best.gte(4) },
				effectDescription: "Keep Booster Upgrades on all resets.",
			},
			3: {
				requirementDescription: "5 Time Capsules",
				done() { return player.t.best.gte(5) },
				effectDescription: "Unlock Auto-Boosters.",
				toggles: [["b", "auto"]],
			},
			4: {
				requirementDescription: "12 Time Capsules",
				done() { return player.t.best.gte(12) },
				effectDescription: "Boosters reset nothing.",
			},
		},
})

addLayer("e", {
        name: "enhance", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "E", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			first: 0,
        }},
        color: "#b82fbd",
        requires() { return new Decimal(1e120).times(Decimal.pow("1e180", Decimal.pow(player[this.layer].unlockOrder, 2))) }, // Can be a function that takes requirement increases into account
        resource: "enhance points", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(.02), // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "e", description: "Press E to Enhance Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        increaseUnlockOrder: ["t", "s"],
        doReset(resettingLayer){ // Triggers when this layer is being reset, along with the layer doing the resetting. Not triggered by lower layers resetting, but is by layers on the same row.
            // TODO
        },
		freeEnh() {
			let enh = new Decimal(0);
			if (hasUpgrade("e", 13)) enh = enh.plus(1);
			return enh;
		},
        layerShown(){return player.b.unlocked&&player.g.unlocked},
        branches: ["b","g"],
		upgrades: {
			rows: 1,
			cols: 4,
			11: {
				title: "Row 2 Synergy",
				description: "Boosters & Generators boost each other.",
				cost: new Decimal(100),
				unlocked() { return player.e.unlocked },
				effect() { 
					let exp = 1
					return {g: player.b.points.add(1).log10().pow(exp), b: player.g.points.add(1).log10().pow(exp)} 
				},
				effectDisplay() { return "+"+format(this.effect().g)+" to Generator base, +"+format(this.effect().b)+" to Booster base" },
			},
			12: {
				title: "Enhanced Prestige",
				description: "Total Enhance Points boost Prestige Point gain.",
				cost: new Decimal(1e3),
				unlocked() { return hasUpgrade("e", 11) },
				effect() { 
					let ret = player.e.total.add(1).pow(1.5) 
					if (ret.gte("1e1500")) ret = ret.sqrt().times("1e750")
					return ret
				},
				effectDisplay() { return format(this.effect())+"x" },
			},
			13: {
				title: "Enhance Plus",
				description: "Get a free Enhancer.",
				cost: new Decimal(2.5e3),
				unlocked() { return hasUpgrade("e", 11) },
			},
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Enhancers",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    if (x.gte(25)) x = x.pow(2).div(25)
                    let cost = Decimal.pow(2, x.pow(1.5))
                    return cost.floor()
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					x = x.plus(tmp.e.freeEnh);
					
                    let eff = {}
                    if (x.gte(0)) eff.first = Decimal.pow(25, x.pow(1.1))
                    else eff.first = Decimal.pow(1/25, x.times(-1).pow(1.1))
                
                    if (x.gte(0)) eff.second = x.pow(0.8)
                    else eff.second = x.times(-1).pow(0.8).times(-1)
                    return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return "Cost: " + formatWhole(data.cost) + " Enhance Points\n\
                    Amount: " + formatWhole(player[this.layer].buyables[this.id])+(tmp.e.freeEnh.gt(0)?(" + "+formatWhole(tmp.e.freeEnh)):"") + "\n\
                    Boosts Prestige Point gain by " + format(data.effect.first) + "x and adds to the Booster/Generator base by " + format(data.effect.second)
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player[this.layer].points.gte(tmp[this.layer].buyables[this.id].cost)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player[this.layer].points = player[this.layer].points.sub(cost)	
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'222px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Enhance Points",
				done() { return player.e.best.gte(2) },
				effectDescription: "Keep Booster/Generator milestones on reset.",
			},
			1: {
				requirementDescription: "5 Enhance Points",
				done() { return player.e.best.gte(5) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			2: {
				requirementDescription: "25 Enhance Points",
				done() { return player.e.best.gte(25) },
				effectDescription: "Keep Booster/Generator Upgrades on reset.",
			},
		},
})

addLayer("s", {
        name: "space", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "S", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 2, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			spent: new Decimal(0),
			first: 0,
        }},
        color: "#dfdfdf",
        requires() { return new Decimal(1e120).times(Decimal.pow("1e180", Decimal.pow(player[this.layer].unlockOrder, 2))) }, // Can be a function that takes requirement increases into account
        resource: "space energy", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(1.85), // Prestige currency exponent
        base: new Decimal(1e15),
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "s", description: "Press S to Space Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        increaseUnlockOrder: ["t", "e"],
        doReset(resettingLayer){ // Triggers when this layer is being reset, along with the layer doing the resetting. Not triggered by lower layers resetting, but is by layers on the same row.
            // TODO
        },
		space() {
			let space = player.s.best.pow(1.1).times(3);
			if (hasUpgrade("s", 13)) space = space.plus(2);
			return space.floor().sub(player.s.spent);
		},
		buildingBaseCosts: {
			11: new Decimal(1e3),
			12: new Decimal(1e10),
			13: new Decimal(1e25),
			14: new Decimal(1e48),
		},
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'Your Space Energy has provided you with ' + formatWhole(tmp.s.space) + ' Space'},
					{}],
			"blank",
			["display-text",
				function() {return 'Your best Space Energy is ' + formatWhole(player.s.best)},
					{}],
			"blank",
			"milestones", "blank", "buyables", "blank", "upgrades"],
        layerShown(){return player.g.unlocked},
        branches: ["g"],
		freeSpaceBuildings() {
			let x = new Decimal(0);
			if (hasUpgrade("s", 11)) x = x.plus(1);
			return x;
		},
		totalBuildingLevels() {
			let len = Object.keys(player.s.buyables).length
			if (len==0) return new Decimal(0);
			if (len==1) return Object.values(player.s.buyables)[0].plus(tmp.s.freeSpaceBuildings)
			let l = Object.values(player.s.buyables).reduce((a,c) => Decimal.add(a, c)).plus(tmp.s.freeSpaceBuildings.times(len));
			return l;
		},
		upgrades: {
			rows: 1,
			cols: 5,
			11: {
				title: "Space X",
				description: "Add a free level to all Space Buildings.",
				cost: new Decimal(2),
				unlocked() { return player[this.layer].unlocked }
			},
			12: {
				title: "Generator Generator",
				description: "Generator Power boosts its own generation.",
				cost: new Decimal(3),
				unlocked() { return hasUpgrade("s", 11) },
				effect() { return player.g.power.add(1).log10().add(1) },
				effectDisplay() { return format(this.effect())+"x" },
			},
			13: {
				title: "Shipped Away",
				description: "Space Building Levels boost Generator Power gain, and you get 2 extra Space.",
				cost: new Decimal(1e37),
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				unlocked() { return hasUpgrade("s", 11) },
				effect() { return Decimal.pow(20, tmp.s.totalBuildingLevels) },
				effectDisplay() { return format(this.effect())+"x" },
			},
			14: {
				title: "Into The Repeated",
				description: "Unlock the <b>Quaternary Space Building</b>.",
				cost: new Decimal(4),
				unlocked() { return hasUpgrade("s", 12)||hasUpgrade("s", 13) }
			},
			15: {
				title: "Four Square",
				description: "The <b>Quaternary Space Building</b> cost is cube rooted, is 3x as strong, and also affects <b>BP Combo</b> (brought to the 2.7th root).",
				cost: new Decimal(1e65),
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				unlocked() { return hasUpgrade("s", 14) },
			},
		},
		buyables: {
			rows: 1,
			cols: 4,
			showRespec() { return player.s.unlocked },
            respec() { // Optional, reset things and give back your currency. Having this function makes a respec button appear
				player[this.layer].spent = new Decimal(0);
                resetBuyables(this.layer)
                doReset(this.layer, true) // Force a reset
            },
            respecText: "Respec Space Buildings", // Text on Respec button, optional
			11: {
				title: "Primary Space Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					if (x.eq(0)) return new Decimal(0);
					return Decimal.pow(base, x.pow(1.35)).times(base);
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let eff = Decimal.pow(x.plus(1).plus(tmp.s.freeSpaceBuildings), player.s.points.sqrt()).times(x.plus(tmp.s.freeSpaceBuildings).max(1).times(4));
					return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return "Cost: " + formatWhole(data.cost) + " Generator Power\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id])+(tmp.s.freeSpaceBuildings.gt(0)?(" + "+formatWhole(tmp.s.freeSpaceBuildings)):"") + "\n\
                    Space Energy boosts Point gain & Prestige Point gain by " + format(data.effect) +"x"
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'100px'},
			},
			12: {
				title: "Secondary Space Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					return Decimal.pow(base, x.pow(1.35)).times(base);
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let eff = x.plus(tmp.s.freeSpaceBuildings).sqrt();
					return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return "Cost: " + formatWhole(data.cost) + " Generator Power\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id])+(tmp.s.freeSpaceBuildings.gt(0)?(" + "+formatWhole(tmp.s.freeSpaceBuildings)):"") + "\n\
                    Adds to base of Booster/Generator effects by +" + format(data.effect)
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'100px'},
			},
			13: {
				title: "Tertiary Space Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					return Decimal.pow(base, x.pow(1.35)).times(base);
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let eff = Decimal.pow(1e18, x.plus(tmp.s.freeSpaceBuildings).pow(0.9))
					if (eff.gte("e3e9")) eff = Decimal.pow(10, eff.log10().times(9e18).cbrt())
					return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return "Cost: " + formatWhole(data.cost) + " Generator Power\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id])+(tmp.s.freeSpaceBuildings.gt(0)?(" + "+formatWhole(tmp.s.freeSpaceBuildings)):"") + "\n\
                    Divide Booster/Generator cost by " + format(data.effect)
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'100px'},
			},
			14: {
				title: "Quaternary Space Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					let cost = Decimal.pow(base, x.pow(1.35)).times(base);
					if (hasUpgrade("s", 15)) cost = cost.root(3);
					return cost;
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let ret = x.plus(tmp.s.freeSpaceBuildings).times((hasUpgrade("s", 15))?3:1).add(1).pow(1.25)
					if (ret.gte(1e6)) ret = ret.log10().times(1e6/6)
					return ret;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return "Cost: " + formatWhole(data.cost) + " Generator Power\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id])+(tmp.s.freeSpaceBuildings.gt(0)?(" + "+formatWhole(tmp.s.freeSpaceBuildings)):"") + "\n\
					<b>Discount One</b> is raised to the power of " + format(data.effect)
                },
                unlocked() { return player[this.layer].unlocked&&hasUpgrade("s", 14) }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'100px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Space Energy",
				done() { return player.s.best.gte(2) },
				effectDescription: "Keep Booster/Generator milestones on reset.",
			},
			1: {
				requirementDescription: "3 Space Energy",
				done() { return player.s.best.gte(3) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			2: {
				requirementDescription: "4 Space Energy",
				done() { return player.s.best.gte(4) },
				effectDescription: "Keep Generator Upgrades on all resets.",
			},
			3: {
				requirementDescription: "5 Space Energy",
				done() { return player.s.best.gte(5) },
				effectDescription: "Unlock Auto-Generators.",
				toggles: [["g", "auto"]],
			},
			4: {
				requirementDescription: "12 Space Energy",
				done() { return player.s.best.gte(12) },
				effectDescription: "Generators reset nothing.",
			},
		},
})

addLayer("a", {
        startData() { return {
            unlocked: true,
        }},
        color: "yellow",
        row: "side",
        layerShown() {return true}, 
        tooltip() { // Optional, tooltip displays when the layer is locked
            return ("Achievements")
        },
        achievements: {
            rows: 3,
            cols: 4,
            11: {
                name: "All that progress is gone!",
                done() { return player.p.points.gt(0) },
                tooltip: "Perform a Prestige reset.",
            },
			12: {
				name: "Point Hog",
				done() { return player.points.gte(25) },
				tooltip: "Reach 25 Points.",
			},
			13: {
				name: "Prestige all the Way",
				done() { return player.p.upgrades.length>=3 },
				tooltip: "Purchase 3 Prestige Upgrades. Reward: Gain 10% more Prestige Points.",
			},
			14: {
				name: "Prestige^2",
				done() { return player.p.points.gte(25) },
				tooltip: "Reach 25 Prestige Points.",
			},
			21: {
				name: "New Rows Await!",
				done() { return player.b.unlocked||player.g.unlocked },
				tooltip: "Perform a Row 2 reset. Reward: Generate Points 10% faster, and unlock 3 new Prestige Upgrades.",
			},
			22: {
				name: "I Will Have All of the Layers!",
				done() { return player.b.unlocked&&player.g.unlocked },
				tooltip: "Unlock Boosters & Generators.",
			},
			23: {
				name: "Prestige^3",
				done() { return player.p.points.gte(1e45) },
				tooltip: "Reach 1e45 Prestige Points. Reward: Unlock 3 new Prestige Upgrades.",
			},
			24: {
				name: "Hey I don't own that company yet!",
				done() { return player.points.gte(1e100) },
				tooltip: "Reach 1e100 Points.",
			},
			31: {
				name: "Further Further Down",
				done() { return player.e.unlocked||player.t.unlocked||player.s.unlocked },
				tooltip: "Perform a Row 3 reset. Reward: Generate Points 50% faster, and Boosters/Generators don't increase each other's requirements.",
			},
			32: {
				name: "Why no meta-layer?",
				done() { return player.points.gte(Number.MAX_VALUE) },
				tooltip: "Reach 1.8e308 Points. Reward: Double Prestige Point gain.",
			},
        },
        midsection: [
            "achievements",
        ]
    }, 
)