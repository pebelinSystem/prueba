import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BlockUI, NgBlockUI} from 'ng-block-ui';
import {Modal, OneButtonPreset} from 'angular2-modal/plugins/bootstrap';
import {TranslateService} from '@ngx-translate/core';
import {Router} from '@angular/router';
import {DialogRef} from 'angular2-modal';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import {ICompany, IInterface, IUnrecognizedMessage} from '../../services/models';
import {UnrecognizedMessageService} from '../../services/UnrecognizedMessage.service';
import {CompanyService} from '../../services/company.service';
import {AuthService} from '../../../auth/auth.service';
import {InterfaceService} from '../../services/interface.service';

export interface IBotParameter {
  company_id: number;
  account_id: number;
  interface_id: string;
  type_id: number;
  start_date: moment.Moment;
  end_date: moment.Moment;
}


@Component({
  selector: 'app-UnrecognizedMessage',
  templateUrl: './UnrecognizedMessage.component.html',
  styleUrls: ['./UnrecognizedMessage.component.scss'],
  providers: [CompanyService, InterfaceService, UnrecognizedMessageService]
})

export class UnrecognizedMessageComponent implements OnInit {

  id=0;
  description;
  valForm: FormGroup;
  @BlockUI() blockUI: NgBlockUI;
  companies: Array<ICompany> = [];
  interfaces: Array<IInterface> = [];
  bot: Array<IUnrecognizedMessage> = [];
  bot_export: Array<IUnrecognizedMessage> = [];

  constructor(
  			      private unrecognizedMessageService: UnrecognizedMessageService,
              private translate: TranslateService,
              private companyService: CompanyService,
              private interfaceService: InterfaceService,
              private fb: FormBuilder,
              private router: Router,
              private authService: AuthService,
              private modal: Modal)  {

    this.valForm = fb.group({
      'company_id': [null, [Validators.required]],
      'interface_id': [null, [Validators.nullValidator]],
      'type_id': [null, [Validators.nullValidator]],
      'start_date': [null, [Validators.nullValidator]],
      'end_date': [null, [Validators.nullValidator]],
    });
  }

  ngOnInit() {
      if (this.authService.loggedIn()) {
      this.loadInitial();
    } else {
      this.sessionOff();
    }
  }

  private loadInitial(): void {
    this.blockUI.start(this.translate.instant('global.general.loading'));

    if (this.authService.isSuperUser()) {
      this.companyService
        .findAllEnabled()
        .subscribe(
          (companies: Array<ICompany>) => {
            this.companies = companies
            this.interfaceService
              .findAllEnabled()
              .subscribe(
                (interfaces: Array<IInterface>) => {
                  this.interfaces = interfaces;
                  this.blockUI.stop();
                },
                () => {
                  this.blockUI.stop();
                }
              );
          },
          (error) => {
            this.blockUI.stop();
          }
        );
    } else {
      this.companies = this.authService.getCompanies();
      this.blockUI.stop();
    }
  }

    private sessionOff(): void {
    this.modal.alert()
      .showClose(false)
      .title(this.translate.instant('global.general.errors.on_session_expired_title'))
      .message(this.translate.instant('global.general.errors.on_session_expired_message'))
      .open().then(
      (dialog: DialogRef<OneButtonPreset>) => {
        dialog.close();
        this.router.navigate(['/login']);
      }
    );
  };

  submit($event, parameters: IBotParameter): void {
    $event.preventDefault();

    if (this.authService.loggedIn()) {

      this.blockUI.start(this.translate.instant('global.general.loading'));
      this.unrecognizedMessageService
          .findByCompany(parameters.company_id, parameters.interface_id, parameters.type_id, parameters.end_date, parameters.start_date)
          .subscribe(
            (bot: Array<IUnrecognizedMessage>) => {
              this.bot  = bot;
              this.blockUI.stop();
            },
            (error) => {
              this.blockUI.stop();
            }
          );

    } else {
      this.sessionOff();
    }
  }
    export (parameters: IBotParameter) {
    if (this.bot.length == 0){
      this.export_excel(parameters);
    }else{
      let data: Array<any> = this.bot.map( (cs: IUnrecognizedMessage) => {
               let text = '';
                if (cs.text != null) {
                  text = cs.text
                }
        return {
                  'ID CHAT': cs.case,
                  'TELEFONO': cs.phone,
                  'MENSAJE': cs.text,
                  'CREADO': moment(cs.created).format('YYYY-MM-DD'),
                  'HORA': moment(cs.created).format('HH:mm:ss'),
              };
      });
      let csvData = this.convertToCSV(data);
      var blob = new Blob(["\ufeff", csvData], {type: 'text/csv'});
      var url = window.URL.createObjectURL(blob);

      if (navigator.msSaveOrOpenBlob){
        navigator.msSaveBlob(blob, 'Mensaje_desc_report.csv');
      } else {
        let a = document.createElement('a');
        a.setAttribute('style', 'display:none;');
        a.href = url;
        a.download = 'Mensaje_desc_report.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      window.URL.revokeObjectURL(url);
    }
  }
  export_excel(parameters: IBotParameter): void {
    if (this.authService.loggedIn()) {

      this.blockUI.start(this.translate.instant('global.general.loading'));

      this.unrecognizedMessageService
          .findByCompany(parameters.company_id, parameters.interface_id, parameters.type_id, parameters.end_date, parameters.start_date)
          .subscribe(
            (bot: Array<any>) => {
              let data: Array<any> = bot.map((cs: IUnrecognizedMessage) => {
               let text = '';
                if (cs.text != null) {
                  text = cs.text
                }
                return {
                  'ID CHAT': cs.case,                  
                  'TELEFONO': '+' + cs.phone.toString().substring(0,2) + ' ' +  cs.phone.toString().substring(2),
                  'MENSAJE': cs.text,
                  'CREADO': moment(cs.created).format('DD/MM/YYYY'),
                  'HORA': moment(cs.created).format('HH:mm:ss'),
                  }
              });
              let tableData = this.convertToTable(data);
              const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(tableData, {raw: true});

              /* generate workbook and add the worksheet */
              const wb: XLSX.WorkBook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

              /* save to file */
              XLSX.writeFile(wb, 'Reporte de mensaje desconocido.xlsx');
              this.blockUI.stop();
            },
            (error) => {
              this.blockUI.stop();
            }
          );
    } else {
      this.sessionOff();
    }
  }

  private convertToTable(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var table = document.createElement('table');
    var tableInnerHTML = "<tr><th>ID CHAT</th><th>TELEFONO</th><th>MENSAJE</th><th>CREADO</th><th>HORA</th></tr>";

    for (var i = 0; i <array.length; i++) {
      var element = "<tr><td>"+array[i]['ID CHAT']+"</td><td>"+array[i]['TELEFONO']+"</td><td>" +array[i]['MENSAJE']+"</td><td>" + array[i]['CREADO'] +"</td><td>" + array[i]['HORA'] +"</td></tr>";
      tableInnerHTML = tableInnerHTML.concat(element);
    }

    table.innerHTML = tableInnerHTML;
    return table;
  }

  private convertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';
    var row = "";

    for (var index in objArray[0]) {
      //Now convert each value to string and comma-separated
      row += index + ',';
    }
    row = row.slice(0, -1);
    //append Label row with line break
    str += row + '\r\n';

    for (var i = 0; i < array.length; i++) {
      var line = '';
      for (var index in array[i]) {
        if (line != '') line += ','

        line += array[i][index];
      }
      str += line + '\r\n';
    }
    return str;
  }
    removeAccents(value) {
        return value
            .replace(/ñ/gmi, 'n')
            .replace(/á/gmi, 'a')            
            .replace(/é/gmi, 'e')
            .replace(/í/gmi, 'i')
            .replace(/ó/gmi, 'o')
            .replace(/ú/gmi, 'u');
    }
}


/**const BOT_DATA: Array<any> = [
  {
    session: 10,
    phone: '02124459845',
   	message: 'Hola ¿Como estan? quiero solicitar mi saldo pero no se como funciona esto',
    description: 'mensaje de catalina',
    created: new Date(),
  },
]**/

