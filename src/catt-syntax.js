//
// catt-syntax.mjs - Catt syntax definitions
//


// Types

export class CattType { constructor() { } }

export class CattObject extends CattType {

    constructor() { super() }
    
}

export class CattArrow extends CattType {

    constructor(src, tgt, base) { 
        // _assert(src instanceof CattTerm)
        // _assert(src instanceof CattTerm)

	super()
        this.src = src
        this.tgt = tgt
        this.base = base
    }
    
}

// Terms

export class CattTerm { constructor() { } }

export class CattVar extends CattTerm {

    constructor(ident) {
	super()
        this.ident = ident
    }

}

export class CattSubst extends CattTerm {

    constructor(tm, subst) {
	super()
        this.tm = tm
        this.subst = subst
    }

}

// Definitions

export class CattDefn {
    constructor() {}
}

export class CattCoh extends CattDefn {

    constructor(ident, pd, ty) {
	super()
        this.ident = ident
        this.pd = pd
        this.ty = ty
    }
    
}

export class CattLet extends CattDefn {

    constructor(ident, ctx, ty, tm) {
	super()
        this.ident = ident
        this.ctx = ctx
        this.ty = ty
        this.tm = tm
    }
    
}

// Dimension Calculations
export function dimOf(exp) {

    if (exp instanceof CattObject) {
        return 0;
    } else if (exp instanceof CattArrow) {
        return 1 + dimOf(exp.base);
    } else if (exp instanceof CattCoh) {
        return dimOf(exp.ty);
    } else if (exp instanceof CattLet) {
        return dimOf(exp.ty);
    } else {
        return -1;
    }
    
}

// Pretty printing

export function prettyPrintTerm(tm) {
    
    if (tm instanceof CattVar) {
	return tm.ident;
    } else if (tm instanceof CattSubst) {

	// A substitution is just a list of terms, so iterate
	// over the list, printing the terms, then apply them
	// to the base term.

	var substStr = "";

	tm.subst.forEach(function(el) {
	    substStr += " " + prettyPrintTerm(el) 
	})
	
	return prettyPrintTerm(tm.tm) + substStr

    } else {
	return "unknown_term";
    }
    
}
    
export function prettyPrintType(ty) {
    
    if (ty instanceof CattObject) {
	return "*";
    } else if (ty instanceof CattArrow) {
	return prettyPrintType(ty.base) + " | " + prettyPrintTerm(ty.src) + " -> " + prettyPrintTerm(ty.tgt);
    } else {
	return "unknown_type";
    }
    
}

export function prettyPrintCtx(ctx) {
    
    // Generate the context string
    var ctxStr = "";
    var cnt = 0;
    
    // Assumes el has "ident" and "type" fields ...
    ctx.forEach(function(el) {
        if (cnt > 0) { ctxStr += " " };
	ctxStr += "(" + el.ident + " : " + prettyPrintType(el.type) + ")";
        cnt++;
    })
    
    return ctxStr;
    
}
    
export function prettyPrintDef(def) {
    
    if (def instanceof CattCoh) {
	return "coh " + def.ident + " " + prettyPrintCtx(def.pd) +
	    " : " + prettyPrintType(def.ty);
    } else if (def instanceof CattLet) {
	return "let " + def.ident + " " + prettyPrintCtx(def.ctx) +
	    " : " + prettyPrintType(def.ty) +
	    " := " + prettyPrintTerm(def.tm);
    } else {
	return "unknown_def";
    }
    
}

