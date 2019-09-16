//
// catt.js - catt javascript routines
//

import { dimOf, prettyPrintCtx, prettyPrintTerm, prettyPrintDef, CattObject, CattArrow, CattVar, CattSubst, CattCoh, CattLet } from './catt-syntax.js';

// Generate a d-dimensional identity coherence
export function generateIdentity(d) {

    var sphCtx = [];
    
    function buildSphere(d) {

        if (d <= 0) { return new CattObject }

        var ty = buildSphere(d-1);
        var s = new CattVar("s" + (d-1));
        var t = new CattVar("t" + (d-1));
        
        sphCtx.push({ ident: "s" + (d-1), type: ty });
        sphCtx.push({ ident: "t" + (d-1), type: ty });
        
        return new CattArrow(s, t, ty);
        
    }

    var sphTy = buildSphere(d);
    sphCtx.push({ ident: "d", type : sphTy });
    
    var coh = new CattCoh("id" + d, sphCtx,
                          new CattArrow(new CattVar("d"),
                                        new CattVar("d"), sphTy));
        
    return coh
    
}

// Generate the name of a grid composition coherence
// provided its dimension profile.
export function gridId(dims) {

    var gridStr = "grid";
    dims.slice(0,dims.length).forEach(function(dim) {
        gridStr += dim;
    });

    return gridStr;
    
}

// Generate a grid composition given its
// dimension profile.
export function generateGridComp(dims) {

    // Initial context consists of a single object
    var ctx = [{ ident : "x0", type : new CattObject }]

    var paramsLeft = Array.from(dims, _ => []);
    var paramsRight = Array.from(dims, _ => []);
    
    function gridLocal(ds, offsets, tgtType) {

        // When there are no dimension specs left, we done
        if (ds.length == 0) {
            // console.log("No work in this dimension");
            return;
        }

        for (var i=0;i<ds[0];i++) {

            // Generate the variable prefix string
            var offsetStr = "x"
            offsets.forEach(function(off) { offsetStr += off });

            var srcIdent = offsetStr + i;
            var tgtIdent = offsetStr + (i+1);
            var flrIdent = srcIdent + "0";
            var newTgtType = new CattArrow(new CattVar(srcIdent), new CattVar(tgtIdent), tgtType);
            
            // New source context element
            ctx.push({ ident : tgtIdent, type : tgtType })
            ctx.push({ ident : flrIdent, type : newTgtType })

            // Record parameters for reconstructing return type
            if (i == 0) {
                paramsLeft[offsets.length].push(new CattVar(srcIdent));
            }

            if (i == ds[0] - 1) {
                paramsRight[offsets.length].push(new CattVar(tgtIdent));
            }
            
            // Recursive call
            gridLocal(ds.slice(1), offsets.concat([i]), newTgtType);

        }
        
    }

    gridLocal(dims, [], new CattObject);

    // console.log("----------------");
    // console.log("Dimension profile: " + dims);
    
    function buildDisk(ds) {

        if (ds.length <= 0) {
            return new CattArrow(paramsLeft[0][0], paramsRight[0][0], new CattObject)
        }

        // Recursively build the boundary
        var ty = buildDisk(ds.slice(0,ds.length-1));

        // Generate the current dimension
        var gridStr = gridId(ds);
        var src = new CattSubst(new CattVar(gridStr), paramsLeft[ds.length]);
        var tgt = new CattSubst(new CattVar(gridStr), paramsRight[ds.length]);
        
        return new CattArrow(src, tgt, ty);
        
    }

    var retTyp = buildDisk(dims.slice(0,dims.length -1));
    var coh = new CattCoh(gridId(dims), ctx, retTyp);
    
    return coh;
    
}

export function letExample() {

    // Context of a single endomorphism:
    // (x : *) (f : x -> x)
    var ctx = [{ ident: "x", type: new CattObject },
               { ident: "f", type: new CattArrow(new CattVar("x"), new CattVar("x"), new CattObject) }];

    // An identifier 
    var id = "letEx";

    // 3 fold arrow composite
    var dims = [3];

    // Return type
    var ty = new CattArrow(new CattVar("x"), new CattVar("x"), new CattObject);

    // List of arguments to compose
    var args = [new CattVar("f"), new CattVar("f"), new CattVar("f")]

    // Apply arguments to grid composition coherence
    var tm = new CattSubst(new CattVar(gridId(dims)), args);

    // Final let declaration
    var letEx = new CattLet(id, ctx, ty, tm);

    return letEx;
    
}

// var coh = generateGridComp([4,2,2]);
// console.log(prettyPrintDef(coh));

var idCoh = generateIdentity(0);
console.log(prettyPrintDef(idCoh));
console.log("Identity has dimension: " + dimOf(idCoh));

export class Interpreter {

    constructor() {};

    // signature -> diagram -> CattLet(?)
    interpretDiagram(sig, dia) {

      let ctx = this.interpretSignatureDim(sig, dia.n);
      return this.interpretDiagramOverCtx(ctx, dia);
    }

    interpretDiagramOverCtx(ctx, dia) {

        // If it's an identity diagram, return the identity on the source interpretation
        if (dia.data.length == 0) {
            return CATTIDENTITY(interpretDiagramOverCtx(ctx, dia.source));
        }

        // Get the type labels at every singular position
        let types = this.extract_content(dia);
        console.log(types);

        // Promote these types to terms of dimension dia.n
        let terms = types.map();
        console.log(terms);

        // Build the grid composite of the terms
        let comp = CATTGRIDCOMPOSITE(terms);
        console.log(comp);

        return comp;
    }

    interpretSignature(sig) {

      return this.interpretSignatureDim(sig, sig.n);
    }

    // Compute the context of all types up to dimension n
    // sig -> nat -> Array[Object]
    interpretSignatureDim(sig, n) {

      if (n==0){
        let ctx = [];
        for (let i=0; i<sig.length; i++) {
          let gen = sig[i];
          if (gen.n != 0) continue;
          ctx.push({ident: gen.generator.id, type: new CattObject() });
        }
        return ctx;
      }

      let sub_ctx = this.interpretSignatureDim(sig, n-1);
      let new_ctx = sub_ctx;
      for (let i=0; i<sig.length; i++) {
        let gen = sig[i];
        if (gen.n != n) continue;
        let src_i = this.interpretDiagramOverCtx(sub_ctx, gen.source);
        let tgt_i = this.interpretDiagramOverCtx(sub_ctx, gen.target);
        assert(src_i.ty.equals(tgt_i.ty));
        let type = new CattArrow(src_i.tm, tgt_i.tm, src_i.ty);
        new_ctx = new_ctx.push({ident: gen.generator.id, type});
      }

      return new_ctx;
    }

    // Convert a deep array of types into terms of dimension n
    static buildTerms(types, sig, n) {

        // If it's an array of types, then map across it
        if (types instanceof Array) return types.map(type => Interpreter.buildTerms(type, sig, n));

        // Otherwise it's a variable
        let id = types;
        let variable = CATTVARIABLE(id);

        // Need to take the identity to obtain a term of dimension n
        let k = n - sig[id].n;
        let term = variable;
        for (let i=0; i<j; i++) {
            term = CATTIDENTITY(term);
        }

        return term;
    }

    // Extracts the type content at every singular position
    extract_content(dia) {

        // Base case, return the type label
        if (dia.n == 0) return dia.id;

        // Recursive case, look at all the singular slices
        let r = [];
        let slices = dia.getSlices();
        for (let i=0; i<dia.data.length; i++) {
            let slice = slices[2 * i + 1]; // get singular slice
            r.push(this.extract_content(slice));
        }

        return r;

    }

}
