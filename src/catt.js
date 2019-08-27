//import { assert } from "@firebase/util";
import { _assert } from "~/util/debug";
import { Diagram } from "~/diagram";


export class CattType {

    constructor() { }
  
}

export class CattObject extends CattType {

    constructor() { super() }

}

export class CattArrow extends CattType {

    constructor(src, tgt) { 
        _assert(src instanceof CattType)
        _assert(src instanceof CattType)

	super()
        this.src = src
        this.tgt = tgt
    }

}

export class CattTerm {

}

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

export class PrettyPrinter {

    prettyPrintTerm(tm) {
	if (tm instanceof CattVar) {
	    return tm.ident;
	} else if (tm instanceof CattSubst) {

	    // A substitution is just a list of terms, so iterate
	    // over the list, printing the terms, then apply them
	    // to the base term.

	    let subStr = "";

	    tm.subst.forEach(function(el) {
		substStr += " " + prettyPrintTerm(el) 
	    })
	    
	    return prettyPrintTerm(tm.tm) + subStr

	} else {
	    return "unknown_term";
	}
    }
    
    prettyPrintType(ty) {
	if (ty instanceof CattOb) {
	    return "*";
	} else if (ty instanceof CattArrow) {
	    return prettyPrintTerm(ty.src) + " -> " + prettyPrintTerm(ty.tgt);
	} else {
	    return "unknown_type";
	}
    }

    prettyPrintCtx(ctx) {
	// Generate the context string
	let ctxStr = "";
	let varCount = 0;
	ctx.forEach(function(el) {
	    ctxStr += " (" + "x" + varCount + " : " + prettyPrintType(el) + ")"
	})
	return ctxStr;
    }
    
    prettyPrintDef(def) {
	if (def instanceof CattCoh) {
	    return "coh " + def.ident + prettyPrintCtx(def.pd) +
		" : " + prettyPrintType(def.ty);
	} else if (def instanceof CattLet) {
	    return "let " + def.ident + prettyPrintCtx(def.ctx) +
		" : " + prettyPrintType(def.ty) +
		" := " + prettyPrintTerm(def.tm);
	} else {
	    return "unknown_def";
	}
    }
    
}

export class TypeChecker {

    // Typechecking routines for Catt Syntax

}

export class GridGenerator {

    // dims: an array of integers [k_i] with k_i > 0 for all i.
    //       these specify the number of cells glued along the
    //       faces of dimension i.
    gen_grid_context(dims) {
    }
    
}

export class Interpreter {

    contructor() {
	
    	this.env = { };

	env.id = new CattCoh("id", [ new CattObj ], new CattArrow(new CattVar(0), new CattVar(0)) )
	
    }

    
    interpret(sig, dia) {
    	return this.interpret_rec(sig, dia, dia.n, 0);
    }

    // interpret : Sig -> Diagram -> Nat -> Nat -> CattLet
    interpret_rec(sig, dia, n /* diagram dimension */, k /* promised to have unique content at k levels */) {

        _assert(dia.n == n);
        // _assert to verify k

        if (n == 1) {
            return this.interpret_1(sig, dia, k);
        }

    }

    interpret_1(sig, dia, k) {

        // if (k == 1) {
        //     return interpret_1_usc(sig, dia);
        // }

        // dia_l = dia.data.length;

        /* explode */

        let components = [];
        let source = dia.source;
        let n = dia.n;
        for (let i=0; i<dia.data.length; i++) {
            let data = dia.data[i];
            components.push(new Diagram({ n, source, data }));
            source = source.rewrite(data);
        }

        // interpret
        let interpretations = components.map(d => this.interpret_1_usc(sig, d, 1));

        // paste
        let coh = this.gen_arrow_comp(dia_l);

        // return final interpretation
        return;

    }

    interpret_1_usc(sig, dia) {

    	let source_type = dia.data[0].forward_limit.source_type;
    	let central_type = dia.data[0].forward_limit.target_type;
    	let target_type = dia.data[0].backward_limit.source_type;

    	if (source_type == central_type) {
    	    _assert(central_type == target_type);
    	    // Identity-like

	    // let def = new CattLet(central_type, ???, ???, ???);

	    return; // Return an identity coherence
	    
    	} else {
    		// Algebraic 1-generator
    		return; // return the name of central_type
    	}
        

    }

    gen_arrow_comp_ctx(n) {
        _assert(isNatural(n));
        if (n == 0) return [new CattObject()];
        let r = this.gen_arrow_comp_ctx(n - 1);
        let y;
        if (n == 1) {
	    y = 0
        } else {
	    y = r.length - 2
        }
        let z = new CattObject();
        let arr = new CattArrow(new CattVar(y), new CattVar(r.length));
        r.push(z, arr);
        return r;
    }

    // gen_arrow_comp : Nat -> CattCoh
    gen_arrow_comp(n) {
        let ctx = gen_arrow_comp_ctx(n)
        let tgt_tm;
        if (n == 0) {
            tgt_tm = 0;
        } else {
            tgt_tm = ctx.length - 2;
        }
        let coh = new CattCoh("comp_1_" + n, ctx, new CattArrow(new CattVar(0), new CattVar(tgt_tm)));
        return coh;
    }

}

