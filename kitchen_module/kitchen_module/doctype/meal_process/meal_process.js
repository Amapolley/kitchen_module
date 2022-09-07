// Copyright (c) 2022, SMB and contributors
// For license information, please see license.txt

frappe.ui.form.on('Meal Process', {
	setup(frm) {
		frm.fields_dict['main_items'].grid.get_field("item_code").get_query = function(doc, cdt, cdn) {
	    return {
		    filters: [
			    ['Item', 'has_recipe', '=','1'],
		    ]
	    }
        }
	},
	item_group(frm){
			frm.set_query("item", function(){
				return {
					filters: [
						["Item","item_group","in", cur_frm.doc.item_group]
					]
				}
			});
	},
	get_sales_orders: function(frm){
		var f_date = cur_frm.doc.from_date;
		var t_date = cur_frm.doc.to_date;
		frappe.db.get_list('Sales Order', {
			fields: ['name','transaction_date','customer','grand_total'],
			filters: [["transaction_date","between",[f_date,t_date]]]
		}).then(records => {
			//console.log(records,records.length);
			if(records.length >=1 ){
				cur_frm.clear_table("sales_orders");
				for(var i=0;i<records.length;i++){
					var add = cur_frm.add_child("sales_orders");
					add.sales_order = records[i]["name"]
					add.sales_order_date = records[i]["transaction_date"]
					add.customer = records[i]["customer"]
					add.grand_total = records[i]["grand_total"]
					cur_frm.refresh_fields("sales_orders");
				}
			}
			else{
				frappe.msgprint(__('No records exist between these dates'));
			}
		})
	},
	get_material_requests: function(frm){
		var f_date = cur_frm.doc.from_date;
		var t_date = cur_frm.doc.to_date;
		frappe.db.get_list('Material Request', {
			fields: ['name','transaction_date'],
			filters: [["transaction_date","between",[f_date,t_date]]]
		}).then(records => {
			//console.log(records,records.length);
			if(records.length >=1 ){
				cur_frm.clear_table("material_requests");
				for(var i=0;i<records.length;i++){
					var add = cur_frm.add_child("material_requests");
					add.material_request = records[i]["name"]
					add.material_request_date = records[i]["transaction_date"]
					cur_frm.refresh_fields("material_requests");
				}
			}
			else{
				frappe.msgprint(__('No records exist between these dates'));
			}
		})
	},
	get_items: function(frm){
		if(cur_frm.doc.get_items_from == "Sales Order"){
			frm.clear_table("main_items");
			frm.clear_table("bom_list");
			frm.clear_table("recipe_items");
			let sales_orders = cur_frm.doc.sales_orders;
			for(let s=0; s<sales_orders.length; s++){
			frappe.db.get_doc('Sales Order', sales_orders[s].sales_order)
    			.then(d => {
        				//console.log(d.items);
						for (let i = 0; i < d.items.length; i++){
							let main_item = cur_frm.add_child("main_items");
							main_item.item_code = d.items[i].item_code;
							main_item.item_name = d.items[i].item_name;
							main_item.item_group = d.items[i].item_group;
							main_item.qty = d.items[i].qty;
							main_item.uom = d.items[i].uom;
							main_item.rate = d.items[i].rate;
							main_item.amount = d.items[i].amount;
							main_item.seles_order_ref = sales_orders[s].sales_order
							cur_frm.refresh_field("main_items");

							frappe.db.get_value('BOM', {item: d.items[i].item_code, is_default: '1'}, ['name','total_cost'])
    						.then(r => {
        							let values = r.message;
        							//console.log(values);
									let t_bom = cur_frm.add_child("bom_list");
									t_bom.bom = values.name;
									t_bom.main_item = d.items[i].item_code;
									t_bom.cost_per_unit = values.total_cost
									t_bom.sales_order_ref = sales_orders[s].sales_order
									t_bom.item_group = d.items[i].item_group;
									cur_frm.refresh_field("bom_list");

									frappe.db.get_doc('BOM', values.name)
    									.then(b => {
        									//console.log(b.items);
											for (let j = 0; j < b.items.length; j++){
												let recipe_item = cur_frm.add_child("recipe_items");
												recipe_item.item_code = b.items[j].item_code;
												recipe_item.item_name = b.items[j].item_name;
												recipe_item.qty = b.items[j].qty;
												recipe_item.uom = b.items[j].uom;
												frappe.db.get_value("Bin", {"item_code":b.items[j].item_code, "warehouse":cur_frm.doc.source_warehouse}, ["actual_qty","valuation_rate"]).then((r)=>{
													if(r.message.actual_qty){
														recipe_item.available_qty = r.message.actual_qty;
													}
													if(r.message.valuation_rate){
														let price = 0;
														price = r.message.valuation_rate
														recipe_item.rate = price;
														recipe_item.amount = b.items[j].qty * price;
													}
												cur_frm.refresh_field("recipe_items");
												})
												recipe_item.parent_item = d.items[i].item_code;
												recipe_item.bom = values.name;
												recipe_item.parent_item_group = d.items[i].item_group;
												recipe_item.sales_order_ref = sales_orders[s].sales_order;
											}
									cur_frm.refresh_field("recipe_items");
    								})
    						})
						}		
    			})
			}
		}
		else{
			frm.clear_table("main_items");
			frm.clear_table("bom_list");
			frm.clear_table("recipe_items");
			let material_requests = cur_frm.doc.material_requests;
			for(let s=0; s<material_requests.length; s++){
			frappe.db.get_doc('Material Request', material_requests[s].material_request)
    			.then(d => {
        				//console.log(d.items);
						for (let i = 0; i < d.items.length; i++){
							let main_item = cur_frm.add_child("main_items");
							main_item.item_code = d.items[i].item_code;
							main_item.item_name = d.items[i].item_name;
							main_item.item_group = d.items[i].item_group;
							main_item.qty = d.items[i].qty;
							main_item.uom = d.items[i].uom;
							main_item.rate = d.items[i].rate;
							main_item.amount = d.items[i].amount;
							main_item.material_request_ref = material_requests[s].material_request
							cur_frm.refresh_field("main_items");

							frappe.db.get_value('BOM', {item: d.items[i].item_code, is_default: '1'}, ['name','total_cost'])
    						.then(r => {
        							let values = r.message;
        							//console.log(values);
									let t_bom = cur_frm.add_child("bom_list");
									t_bom.bom = values.name;
									t_bom.main_item = d.items[i].item_code;
									t_bom.cost_per_unit = values.total_cost
									t_bom.material_request_ref = material_requests[s].material_request
									t_bom.item_group = d.items[i].item_group;
									cur_frm.refresh_field("bom_list");

									frappe.db.get_doc('BOM', values.name)
    									.then(b => {
        									//console.log(b.items);
											for (let j = 0; j < b.items.length; j++){
												let recipe_item = cur_frm.add_child("recipe_items");
												recipe_item.item_code = b.items[j].item_code;
												recipe_item.item_name = b.items[j].item_name;
												recipe_item.qty = b.items[j].qty;
												recipe_item.uom = b.items[j].uom;
												frappe.db.get_value("Bin", {"item_code":b.items[j].item_code, "warehouse":cur_frm.doc.source_warehouse}, ["actual_qty","valuation_rate"]).then((r)=>{
													if(r.message.actual_qty){
														recipe_item.available_qty = r.message.actual_qty;
													}
													if(r.message.valuation_rate){
														let price = 0;
														price = r.message.valuation_rate
														recipe_item.rate = price;
														recipe_item.amount = b.items[j].qty * price;
													}
												cur_frm.refresh_field("recipe_items");
												})
												recipe_item.parent_item = d.items[i].item_code;
												recipe_item.bom = values.name;
												recipe_item.material_request_ref = material_requests[s].material_request;
												recipe_item.parent_item_group = d.items[i].item_group;
											}
									cur_frm.refresh_field("recipe_items");
    								})
    						})
						}		
    			})
			}
		}
	},
	add: function(frm){
		if(cur_frm.doc.item){
			let item_name;
			let item_group;
			let uom;
			frappe.db.get_value("Item", {"item_code":cur_frm.doc.item}, ["item_name","item_group","stock_uom"]).then((i)=>{
				if(i.message){
					//console.log(r.message);
					item_name = i.message.item_name;
					item_group = i.message.item_group;
					uom = i.message.stock_uom;
				}

				frappe.db.get_value("Item Price", {"item_code":cur_frm.doc.item, "selling":1}, "price_list_rate").then((j)=>{
					if(j.message.price_list_rate){
						let rate = 0;
						let amount = 0;
						rate = j.message.price_list_rate;
						amount = cur_frm.doc.quantity * rate;
						//console.log(item_name,item_group,uom,rate,amount);

						let item = cur_frm.add_child("main_items");
						item.item_code = cur_frm.doc.item;
						item.item_name = item_name;
						item.item_group = item_group;
						item.qty = cur_frm.doc.quantity;
						item.uom = uom;
						item.rate = rate;
						item.amount = amount;
						cur_frm.refresh_field("main_items");
						cur_frm.set_value("item","");
						cur_frm.set_value("quantity","");
					}
				});
			})
		}
	},
	get_bom: function(frm){
		if(cur_frm.doc.main_items){
			let items = cur_frm.doc.main_items;
			for (let i = 0; i < items.length; i++){
				frappe.db.get_value('BOM', {item: items[i].item_code, is_default: '1'}, ['name','total_cost'])
				.then(r => {
						let values = r.message;
						//console.log(values);
						let t_bom = cur_frm.add_child("bom_list");
						t_bom.bom = values.name;
						t_bom.main_item = items[i].item_code;
						t_bom.cost_per_unit = values.total_cost
						t_bom.item_group = items[i].item_group;
						cur_frm.refresh_field("bom_list");

						frappe.db.get_doc('BOM', values.name)
							.then(b => {
								//console.log(b.items);
								for (let j = 0; j < b.items.length; j++){
									let recipe_item = cur_frm.add_child("recipe_items");
									recipe_item.item_code = b.items[j].item_code;
									recipe_item.item_name = b.items[j].item_name;
									recipe_item.qty = b.items[j].qty;
									recipe_item.uom = b.items[j].uom;
									frappe.db.get_value("Bin", {"item_code":b.items[j].item_code, "warehouse":cur_frm.doc.source_warehouse}, ["actual_qty","valuation_rate"]).then((w)=>{
										if(w.message.actual_qty){
											recipe_item.available_qty = w.message.actual_qty;
										}
										if(w.message.valuation_rate){
											let price = 0;
											price = w.message.valuation_rate
											recipe_item.rate = price;
											recipe_item.amount = b.items[j].qty * price;
										}
									cur_frm.refresh_field("recipe_items");
									})
									recipe_item.parent_item = items[i].item_code;
									recipe_item.bom = values.name;
									recipe_item.parent_item_group = items[i].item_group;
								}
						cur_frm.refresh_field("recipe_items");
						});
				});
			}
		}
	},
	get_rates: function(frm){
		if(cur_frm.doc.main_items){
			let items = cur_frm.doc.main_items;
			for( let k=0;k<items.length;k++){
				let item_name;
				let item_group;
				let uom;
				frappe.db.get_value("Item", {"item_code":items[k].item_code}, ["item_name","item_group","stock_uom"]).then((i)=>{
					if(i.message){
						//console.log(r.message);
						item_name = i.message.item_name;
						item_group = i.message.item_group;
						uom = i.message.stock_uom;
					}

					frappe.db.get_value("Item Price", {"item_code":items[k].item_code, "selling":1}, "price_list_rate").then((j)=>{
						if(j.message.price_list_rate){
							let rate = 0;
							let amount = 0;
							rate = j.message.price_list_rate;
							amount = items[k].qty * rate;
							//console.log(item_name,item_group,uom,rate,amount);

							items[k].item_name = item_name;
							items[k].item_group = item_group;
							items[k].uom = uom;	
							items[k].rate = rate;
							items[k].amount = amount;
							cur_frm.refresh_field("main_items");
						}
					});
				})
			}
		}

	}

});
frappe.ui.form.on('MP Main Items', {
	before_main_items_remove:function(frm, cdt, cdn){
		var deleted_row = frappe.get_doc(cdt, cdn);
    	//console.log(deleted_row.item_code);
		if(cur_frm.doc.bom_list && cur_frm.doc.recipe_items){
			let boms = cur_frm.doc.bom_list;
			for(var i=0;i<boms.length;i++){
				if (boms[i].main_item == deleted_row.item_code){
					cur_frm.get_field("bom_list").grid.grid_rows[i].remove();
				}
			}
			let recipes = cur_frm.doc.recipe_items;
			for(var j=recipes.length-1;j>=0;j--){
				if(recipes[j].parent_item == deleted_row.item_code){
					cur_frm.get_field("recipe_items").grid.grid_rows[j].remove();
				}
			}

		}
		
		cur_frm.refresh();
	}
});