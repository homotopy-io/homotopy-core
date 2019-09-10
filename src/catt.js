//
// catt.js - catt javascript routines
//

import { prettyPrintCtx, prettyPrintTerm, prettyPrintDef, CattObject, CattArrow, CattVar, CattSubst, CattCoh, CattLet } from './catt-syntax.js';

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

    var paramsLeft = [];
    var paramsRight = [];
    
    // Okay, fantastic.  This looks good.  So the next idea is to
    // record the source and target arguments so that we can do the
    // whole coherence....

    // How to do this? We would like to mark the codimension 1
    // entry and exit points.
    
    function gridLocal(ds, offsets, tgtType) {

        // console.log("----------------");
        // console.log("In dimension: " + offsets.length);
        // console.log("Dimension profile: " + ds);
        // console.log("Offset profile: " + offsets);
        
        // When there are no dimension specs left, we done
        if (ds.length == 0) {
            // console.log("No work in this dimension");
            return;
        }

        var markParams = ds.length == 1;
        
        for (var i=0;i<ds[0];i++) {

            // Generate the variable prefix string
            var offsetStr = "x"
            offsets.forEach(function(off) { offsetStr += off });

            var srcIdent = offsetStr + i;
            var tgtIdent = offsetStr + (i+1);
            var flrIdent = srcIdent + "0";
            var newTgtType = new CattArrow(new CattVar(srcIdent), new CattVar(tgtIdent));
            
            // New source context element
            ctx.push({ ident : tgtIdent, type : tgtType })
            ctx.push({ ident : flrIdent, type : newTgtType })

            if (i == 0 && markParams) {
                // console.log("Found left parameter: " + offsetStr + i);
                paramsLeft.push(new CattVar(srcIdent));
            }

            if (i == ds[0] - 1 && markParams) {
                // console.log("Found right parameter: " + offsetStr + (i+1));
                paramsRight.push(new CattVar(tgtIdent));
            }
            
            // Recursive call
            gridLocal(ds.slice(1), offsets.concat([i]), newTgtType);

        }
        
    }

    gridLocal(dims, [], new CattObject);

    console.log("----------------");
    // console.log(prettyPrintCtx(ctx));
    // console.log("Left Parameters: " + paramsLeft);
    // console.log("Right Parameters: " + paramsRight);

    console.log("Dimension profile: " + dims);

    var gridPrefStr = gridId(dims.slice(0,dims.length - 1));
    var gridStr = gridPrefStr + dims[dims.length-1];

    var srcTyp = new CattSubst(new CattVar(gridPrefStr), paramsLeft);
    var tgtTyp = new CattSubst(new CattVar(gridPrefStr), paramsRight);
    var retTyp = new CattArrow(srcTyp, tgtTyp);
    var coh = new CattCoh(gridStr, ctx, retTyp);
    
    return coh;
    
}

export function letExample() {

    // Context of a single endomorphism:
    // (x : *) (f : x -> x)
    var ctx = [{ ident: "x", type: new CattObject },
               { ident: "f", type: new CattArrow(new CattVar("x"), new CattVar("x")) }];

    // An identifier 
    var id = "letEx";

    // 3 fold arrow composite
    var dims = [3];

    // Return type
    var ty = new CattArrow(new CattVar("x"), new CattVar("x"));

    // List of arguments to compose
    var args = [new CattVar("f"), new CattVar("f"), new CattVar("f")]

    // Apply arguments to grid composition coherence
    var tm = new CattSubst(new CattVar(gridId(dims)), args);

    // Final let declaration
    var letEx = new CattLet(id, ctx, ty, tm);

    return letEx;
    
}

var coh = generateGridComp([2,3]);
console.log(prettyPrintDef(coh));

console.log(prettyPrintDef(letExample()));

