import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BlockUI, NgBlockUI} from 'ng-block-ui';
import { ICompany,  IInterface, IEncuesta} from '../../services/models';
import {AuthService} from '../../../auth/auth.service';
import {Modal, OneButtonPreset} from 'angular2-modal/plugins/bootstrap';
import {CompanyService} from '../../services/company.service';
import {TranslateService} from '@ngx-translate/core';
import {Router} from '@angular/router';
import {EncuestaService} from '../../services/encuesta.service';
import {DialogRef} from 'angular2-modal';
import * as moment from 'moment';
import {InterfaceService} from '../../services/interface.service';
import * as XLSX from 'xlsx';

export interface IEncuestaParameter {
  company_id: number;
  account_id: number;
  interface_id: string;
  type_id: number;
  start_date: moment.Moment;
  end_date: moment.Moment;
}

@Component({
  selector: 'app-encuesta',
  templateUrl: './encuesta.component.html',
  styleUrls: ['./encuesta.component.scss'],
  providers: [CompanyService, InterfaceService, EncuestaService]
})


export class EncuestaComponent implements OnInit {

  id=0;
  rate= 0;
  description;
  valForm: FormGroup;
  @BlockUI() blockUI: NgBlockUI;
  companies: Array<ICompany> = [];
  interfaces: Array<IInterface> = [];
  polls: Array<IEncuesta> = [];
  encuesta_export: Array<IEncuesta> = [];


  constructor(
              private encuestaService: EncuestaService,
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
            this.companies = companies;
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

  formatDate(date: string) {
    return moment(date).format('DD/MM/YYYY HH:mm:ss');
  }

  sec_to_time(time) {
    return moment.utc(time*1000).format("HH:mm:ss");
  }

  submit($event, parameters: IEncuestaParameter): void {
    $event.preventDefault();

    if (this.authService.loggedIn()) {

      this.blockUI.start(this.translate.instant('global.general.loading'));
      this.encuestaService
          .findByCompany(parameters.company_id, parameters.interface_id, parameters.type_id, parameters.end_date, parameters.start_date)
          .subscribe(
            (polls: Array<IEncuesta>) => {
              this.polls  = polls;
              this.blockUI.stop();
              console.log(this.polls);
            },
            (error) => {
              this.blockUI.stop();
            }
          );

    } else {
      this.sessionOff();
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
   }

  export (parameters: IEncuestaParameter) {
    if (this.polls.length == 0){
      this.export_excel(parameters);
    }else{
      let data: Array<any> = this.polls.map( (cs: IEncuesta) => {
         let description = '';
          if (cs.description != null) {
            description = cs.description
          }
        return {
                'ID CHAT': cs.case,
                'GSM / ID USUARIO': cs.phone,
                'COMENTARIO': description,
                'VALORACION ': cs.rate,
                'FECHA': moment(cs.created).format('YYYY-MM-DD'),
                'TIEMPO CHAT': moment(cs.created).format('HH:mm:ss'),
              };
      });
      let csvData = this.convertToCSV(data);
      var blob = new Blob(["\ufeff", csvData], {type: 'text/csv'});
      var url = window.URL.createObjectURL(blob);

      if (navigator.msSaveOrOpenBlob){
        navigator.msSaveBlob(blob, 'Reporte de la Encuesta.csv');
      } else {
        let a = document.createElement('a');
        a.setAttribute('style', 'display:none;');
        a.href = url;
        a.download = 'Reporte de la Encuesta.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      window.URL.revokeObjectURL(url);
    }
  }
  export_excel(parameters: IEncuestaParameter): void {
    if (this.authService.loggedIn()) {

      this.blockUI.start(this.translate.instant('global.general.loading'));

      this.encuestaService
          .findByCompany(parameters.company_id, parameters.interface_id, parameters.type_id, parameters.end_date, parameters.start_date)
          .subscribe(
            (polls: Array<IEncuesta>) => {
              let data: Array<any> = polls.map((cs: IEncuesta) => {
               let description = '';
                if (cs.description != null) {
                  description = cs.description
                }
                return {
                  'ID CHAT': cs.case,
                  'GSM / ID USUARIO': '+' + cs.phone.toString().substring(0,2) + ' ' +  cs.phone.toString().substring(2),
                  'COMENTARIO': description,
                  'VALORACION': cs.rate,
                  'FECHA': moment(cs.created).format('DD/MM/YYYY'),
                  'HORA': moment(cs.created).format('HH:mm:ss'),
                  'TIEMPO CHAT': moment(cs.created).format('HH:mm:ss'),
                  }
              });

              let tableData = this.convertToTable(data);
              const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(tableData, {raw: true});

              /* generate workbook and add the worksheet */
              const wb: XLSX.WorkBook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

              /* save to file */
              XLSX.writeFile(wb, 'Reporte de la encuesta.xlsx');
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

  private convertToTable(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var table = document.createElement('table');
    var tableInnerHTML = "<tr><th>ID CHAT</th><th>GSM / ID USUARIO</th><th>COMENTARIO</th><th>VALORACION</th><th>FECHA</th><th>HORA</th><th>TIEMPO CHAT</th></tr>";

    for (var i = 0; i <array.length; i++) {
      var element = "<tr><td>"+array[i]['ID CHAT']+"</td><td>"+array[i]['GSM / ID USUARIO']+"</td><td>" +array[i]['COMENTARIO']+"</td><td>" + array[i]['VALORACION'] +"</td><td>" + array[i]['FECHA']+ "</td><td>" +array[i]['HORA']+"</td><td>" +array[i]['TIEMPO CHAT']+"</td></tr>";
      tableInnerHTML = tableInnerHTML.concat(element);
    }
    console.log(tableInnerHTML);
    table.innerHTML = tableInnerHTML;
    return table;
    
  }
}

/*const ENCUESTA_DATA: Array<any> = [
  {
    case: 24,
    //helped: true,
    rate: 5,
    description: 'Buen servicio',
    created: new Date(),
    //modified: new Date()
  },
]*/
