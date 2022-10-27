import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersComponent } from './customers/customers.component';
import { SharedModule} from "../../shared/shared.module";
import {RouterModule, Routes} from "@angular/router";
import {CalendarModule} from "primeng/primeng";
import {CasesComponent} from "./cases/cases.component";
import { EncuestaComponent } from './encuesta/encuesta.component';
import { UnrecognizedMessageComponent } from './UnrecognizedMessage/UnrecognizedMessage.component';
import { TotalsmessageComponent } from './totalsmessage/totalsmessage.component';
import { PingComponent } from './ping/ping.component';
import { TracertComponent } from './tracert/tracert.component';


const routes: Routes = [
/*  {path: 'customers', component: CustomersComponent, data: {title: 'Customers | Reports | Optimus'}},*/
  {path: 'cases', component: CasesComponent, data: {title: 'Cases | Reports | Optimus'}},
  {path: 'encuesta', component: EncuestaComponent, data: {title: 'Encuesta | Reports | Optimus'}},
  {path: 'UnrecognizedMessage', component: UnrecognizedMessageComponent, data: {title: 'Unrecognized Message | Reports | Optimus'}},
  {path: 'totalsmessage', component: TotalsmessageComponent, data: {title: 'Totals Message | Reports | Optimus'}},
];

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    CalendarModule,
    RouterModule.forChild(routes)
  ],
  declarations: [CustomersComponent, CasesComponent, EncuestaComponent, UnrecognizedMessageComponent, TotalsmessageComponent, PingComponent, TracertComponent],
  exports: [
    RouterModule
  ]
})
export class ReportsModule {}

