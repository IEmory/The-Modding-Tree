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
			if (hasUpgrade("p", 21)) mult = mult.times(1.8);
			if (hasUpgrade("b", 11)) mult = mult.times(upgradeEffect("b", 11));
			if (hasUpgrade("g", 11)) mult = mult.times(upgradeEffect("g", 11));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            let exp = new Decimal(1)
			if (hasUpgrade("p", 31)) exp = exp.times(1.05);
			return exp;
        },
        row: 0, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "p", description: "Reset for prestige points", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        layerShown(){return true},
		update(diff) {
			if (hasMilestone("g", 1)) generatePoints("p", diff);
		},
		doReset(resettingLayer) {
			let keep = [];
			if (hasMilestone("b", 0) && resettingLayer=="b") keep.push("upgrades")
			if (hasMilestone("g", 0) && resettingLayer=="g") keep.push("upgrades")
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
			return mult;
		},
		canBuyMax() { return hasMilestone("b", 1) },
        row: 1, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "b", description: "Perform a booster reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        layerShown(){return player.p.unlocked},
		automate() {},
		resetsNothing() { return false },
		effectBase() {
			let base = new Decimal(2);
			if (hasUpgrade("b", 12)) base = base.plus(upgradeEffect("b", 12));
			if (hasUpgrade("b", 13)) base = base.plus(upgradeEffect("b", 13));
			return base;
		},
		effect() {
			return Decimal.pow(this.effectBase(), player.b.points).max(0);
		},
		effectDescription() {
			return "which are boosting Point generation by "+format(this.effect())+"x"
		},
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			first: 0,
		}},
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
				effect() { return player.b.best.sqrt().plus(1) },
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
				unlocked() { return player.b.unlocked&&player.b.best.gte(8) },
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
				effect() { return player.points.add(1).log10().add(1).pow(3.2) },
				unlocked() { return hasUpgrade("b", 21) || hasUpgrade("b", 22) },
				effectDisplay() { return "/"+format(this.effect()) },
			},
		},
})

addLayer("g", {
        name: "generators", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "G", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#47b346",
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
			return mult;
		},
		canBuyMax() { return hasMilestone("g", 2) },
        row: 1, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "g", description: "Perform a generator reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        layerShown(){return player.p.unlocked},
		automate() {},
		resetsNothing() { return false },
		effBase() {
			let base = new Decimal(2);
			if (hasUpgrade("g", 12)) base = base.plus(upgradeEffect("g", 12));
			if (hasUpgrade("g", 13)) base = base.plus(upgradeEffect("g", 13));
			return base;
		},
		effect() {
			let eff = Decimal.pow(this.effBase(), player.g.points).sub(1).max(0);
			if (hasUpgrade("g", 21)) eff = eff.times(upgradeEffect("g", 21));
			if (hasUpgrade("g", 25)) eff = eff.times(upgradeEffect("g", 25));
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
		}},
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
			if (layers[resettingLayer].row > this.row) layerDataReset("p", keep)
		},
		tabFormat: ["main-display",
			["prestige-button", function(){return "Melt your points into "}],
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
				title: "Discout Two",
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
            rows: 2,
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
        },
        midsection: [
            "achievements",
        ],
		update(diff) {	// Added this section to call adjustNotificationTime every tick, to reduce notification timers
			adjustNotificationTime(diff);
		},	
	},
)