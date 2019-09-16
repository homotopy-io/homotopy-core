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

// l is a CattLet object.  Return
// associated identity let definition
export function cattLetIdentity(l) {

    var ident = l.ident + "_id";
    var ctx = l.ctx;
    var ty = new CattArrow(l.tm, l.tm, l.ty);
    // l.tm should also be completely well defined
    // since the context has not changed.
    var tm = new CattSubst(new CattVar("id" + dimOf(l)), [l.tm])

    return new CattLet(ident, ctx, ty, tm);
    
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

//var coh = generateGridComp([4,2,2]);
//console.log(prettyPrintDef(coh));

// var idCoh = generateIdentity(0);
// console.log(prettyPrintDef(idCoh));
// console.log("Identity has dimension: " + dimOf(idCoh));

export class Interpreter {

    constructor() {

        //let testarr = [[[1,2],[3,4],[5,6]],[[7,8],[9,10],[11,12]],[[13,14],[15,16],[17,18]],[[19,20],[21,22],[23,24]]];
        //console.log(Interpreter.deepTransposeFlatten(testarr));

    };

    
    // signature -> diagram -> CattLet
    interpretDiagram(sig, dia) {

        let ctx = this.interpretSignatureDim(sig, dia.n);
        let int = this.interpretDiagramOverCtx(ctx, dia);
        console.log(prettyPrintDef(int));
        return int;
        
    }

    // ctx -> diamgram -> CattLet
    interpretDiagramOverCtx(ctx, dia) {

        if (dia.n == 0) {
          return new CattLet("var_" + dia.id, ctx, new CattObject(), new CattVar(dia.id));
        }

        // If it's an identity diagram, return the identity on the source interpretation
        if (dia.data.length == 0) {
            return cattLetIdentity(this.interpretDiagramOverCtx(ctx, dia.source));
        }

        // Get the type labels at every singular position
        let types = this.extract_content(dia);
        console.log(types);

        // Promote these types to terms of dimension dia.n
        let terms = types.map(function(elt){return Interpreter.buildTerms(elt, ctx, dia.n)});
        console.log(terms);

        // We flatten the iteratively nested list of terms
        // and extract the grid profile.  
        // CHECKME: is the direction correct????
        var prof = [terms.length];
        var head = terms[0];
        
        // Assumes tms non-empty ....
        while (head instanceof Array) {
            
            prof.unshift(head.length);
            head = head[0];
            
        }
        
       

        
        // Build the grid composite of the terms
        let comp = new CattSubst(new CattVar(gridId(prof)), Interpreter.deepTransposeFlatten(terms));
        console.log(comp);

        var src = this.interpretDiagramOverCtx(ctx, dia.source);
        var tgt = this.interpretDiagramOverCtx(ctx, dia.getTarget());

        // assert src.ty == tgt.ty
        return new CattLet("???", ctx, new CattArrow(src.tm, tgt.tm, src.ty), comp) ;
        
    }

    static deepTransposeFlatten(a) {

      function transpose(b) {
          var c = [];
          for (let i=0;i<b.length;i++) {
              for (let j=0;j<b[i].length;j++) {
                  if (c[j] == undefined) c[j] = [];
                  c[j][i] = b[i][j];
              }
          }
          return c;
      }
      
      if (! (a instanceof Array)) return a;
      if (! (a[0] instanceof Array)) return a;
      
      var b = a.map(el => Interpreter.deepTransposeFlatten(el))
      return transpose(b).flat()
      
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
          if (gen.generator.n != 0) continue;
          ctx.push({ident: gen.generator.id, type: new CattObject() });
        }
        return ctx;
      }

      let sub_ctx = this.interpretSignatureDim(sig, n-1);
      let new_ctx = sub_ctx;
      for (let i=0; i<sig.length; i++) {
        let gen = sig[i];
        if (gen.generator.n != n) continue;
        let src_i = this.interpretDiagramOverCtx(sub_ctx, gen.generator.source);
        let tgt_i = this.interpretDiagramOverCtx(sub_ctx, gen.generator.target);
        //assert(src_i.ty.equals(tgt_i.ty));
        let type = new CattArrow(src_i.tm, tgt_i.tm, src_i.ty);
        new_ctx.push({ident: gen.generator.id, type});
      }

      return new_ctx;
    }

    // Convert a deep array of types into terms of dimension n
    static buildTerms(types, ctx, n) {

        let x = 1;
        x ++;

        // If it's an array of types, then map across it
        if (types instanceof Array) return types.map(type => Interpreter.buildTerms(type, ctx, n));

        // Otherwise it's a variable
        let id = types;
        let variable = new CattVar(id);
        let dim = dimOf(ctx.filter(obj => obj.ident == id)[0].type);

        // Need to take the identity to obtain a term of dimension n
        let term = variable;
        for (let i=dim; i<n; i++) {
            term = new CattSubst(new CattVar("id" + i) , [term]);
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


