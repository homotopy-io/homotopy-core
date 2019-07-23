import { assert } from "@firebase/util";


export class CattType {

    constructor() {}
  
}

class CattObject extends CattType {

    constructor() { }

}

class CattArrow extends CattType {

    constructor(src, tgt) { 
        assert(src instanceof CattType)
        assert(src instanceof CattType)

        this.src = src
        this.tgt = tgt
    }

}

class CattTerm {

}

class CattVar extends CattTerm {

    constructor(ident) {
        this.ident = ident
    }

}

class CattSubst extends CattTerm {

    constructor(tm, subst) {
        this.tm = tm
        this.subst = subst
    }

}

class CattDefn {
    constructor() {}
}

class CattCoh extends CattDefn {

    constructor(ident, pd, ty) {
        this.ident = ident
        this.pd = pd
        this.ty = ty
    }

}

class CattLet extends CattDefn {

    constructor(ident, ctx, ty, tm) {
        this.ident = ident
        this.ctx = ctx
        this.ty = ty
        this.tm = tm
    }

}

class TypeChecker {

    // Typechecking routines for Catt Syntax

}

class Interpreter {

    // interpret : Sig -> Diagram -> Nat -> Nat -> CattLet
    interpret(sig, dia, n /* diagram dimension */, k /* promised to have unique content at k levels */) {

        _assert(dia.n == n);
        // _assert to verify k

        if (n == 1) {
            return interpret_1(sig, dia, k);
        }

    }

    interpret_1(sig, dia, k) {

        if (k == 1) {
            return interpret_1_usc(sig, dia);
        }

        dia_l = dia.data.length;

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
        let interpretations = components.map(d => this.interpret(sig, d, 1));

        // paste
        let coh = this.gen_arrow_comp(dia_l);

        // return final interpretation
        return;

    }

    interpret_1_usc(sig, dia) {
        

    }

    gen_arrow_comp_ctx(n) {
        _assert(isNatural(n));
        if (n == 0) return [new CattObject()];
        let r = this.gen_arrow_comp_ctx(n - 1);
        let y;
        if (n == 1) {
            y = r[0];
        } else {
            y = r[r.length - 2];
        }
        let z = new CattObject();
        let arr = new CattType(r, z);
        r.push(z, arr);
        return r;
    }

    // gen_arrow_comp : Nat -> CattCoh
    gen_arrow_comp(n) {
        let ctx = gen_arrow_comp_ctx(n)
        let tgt_tm;
        if (n == 0) {
            tgt_tm = ctx[0];
        } else {
            tgt_tm = ctx[ctx.length - 2];
        }
        let coh = new CattCoh("comp_1_" + n, ctx, new CattType(ctx[0], tgt_tm));
        return coh;
    }

}

