package com.example.demo.enums.arcoRequestAction;

public enum ArcoActionType {

    //Flujo de revision
    SUBMITTED, //solicitud enviada
    UNDER_REVIEW,//en revision
    VERIFIED,//identidad verificada

    //Decision
    APPROVED,
    REJECTED,
    REQUEST_MORE_INFO, //Se solicita mas info

    //Ejecucion
    EXECUTED, //accion ejecutada (ej: eliminacion de datos ...)
    PARTIALLY_EXECUTED,//ejecutado parcialmente
    FAILED,//fallo la ejecucion

    //Cierre
    CLOSED //caso cerrado
}
